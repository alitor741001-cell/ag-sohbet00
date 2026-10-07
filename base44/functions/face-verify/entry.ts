import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { rateLimit } from '../../shared/security.ts';
import { notifyUser } from '../../shared/notifyUser.ts';
import { refreshAgencyTotals } from '../../shared/agency.ts';

/**
 * Yüz doğrulama servisi.
 *
 * - Kayıt (enroll): hesabın referans yüz fotoğrafı bir kez alınır, cihaz güvenilir
 *   cihaz listesine yazılır ve yeni hesap aynı yüzle eşleşiyor mu diye taranır.
 * - Doğrulama (verify): canlı fotoğraf referans fotoğrafla karşılaştırılır; eşleşirse
 *   cihaz (giriş kapısı) ya da bakiye kilidi açılır.
 * - Durum (status) / aç-kapat (toggle): yüz doğrulamasının açık olup olmadığı.
 *
 * Yan hesap kuralı: aynı yüzle doğrulanan iki hesaptan YENİ açılan hesabın yayıncılığı
 * ve ajans üyeliği iptal edilir; ilk (eski) hesap yayıncılığını korur.
 */
const VERIFY_CONFIDENCE = 0.6;
const DUPLICATE_CONFIDENCE = 0.8;
const SCAN_LIMIT = 6;
const DEVICE_LIMIT = 8;
// Aç/kapa ile yüz doğrulaması bu kadar kez yeniden istenir; sonrasında bir daha sorulmaz.
const TOGGLE_CHECK_LIMIT = 2;

const COMPARE_PROMPT = [
  'You are a strict biometric verifier for account security.',
  'Image 1 is the enrolled reference face. Image 2 is a new live selfie.',
  'Decide whether both images show the same human face.',
  'Compare the face structure: face shape, eyes, eyebrows, nose, mouth, jawline, ears.',
  'Ignore lighting, camera angle, expression, make-up, glasses, hair style, clothing and background.',
  'If either image does not show one single clearly visible human face — for example a photo of a screen, a group photo, or a blurred/covered face — set same_person to false and confidence to 0.',
  'Set face_visible to true only when Image 2 (the live selfie) shows one complete face: forehead, both eyes, nose, mouth and chin all inside the frame.',
  'Set face_visible to false for a half or cropped face, a hand, an object, a covered or blurred face, or a photo of a screen.',
  'Return JSON with your decision and a confidence value between 0 and 1.',
].join(' ');

const MATCH_SCHEMA = {
  type: 'object',
  properties: {
    same_person: { type: 'boolean' },
    confidence: { type: 'number' },
    face_visible: { type: 'boolean' },
    note: { type: 'string' },
  },
  required: ['same_person', 'confidence', 'face_visible'],
};

async function faceRecord(base44, userId) {
  const rows = await base44.asServiceRole.entities.FaceCheck
    .filter({ user_id: userId }, '-created_date', 1).catch(() => []);
  return rows?.[0] || null;
}

async function signedUrl(base44, fileUri) {
  if (!fileUri) return '';
  const res = await base44.asServiceRole.integrations.Core
    .CreateFileSignedUrl({ file_uri: fileUri, expires_in: 900 }).catch(() => null);
  return res?.signed_url || '';
}

/** İki fotoğrafı karşılaştırır. Servis hatasında null döner: kullanıcı kilitlenmez. */
async function compareFaces(base44, referenceUri, selfieUri) {
  try {
    const [reference, selfie] = await Promise.all([
      signedUrl(base44, referenceUri),
      signedUrl(base44, selfieUri),
    ]);
    if (!reference || !selfie) return null;
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: COMPARE_PROMPT,
      file_urls: [reference, selfie],
      response_json_schema: MATCH_SCHEMA,
    });
    const confidence = Math.max(0, Math.min(1, Number(result?.confidence) || 0));
    return { same: result?.same_person === true, confidence, faceVisible: result?.face_visible !== false };
  } catch {
    return null;
  }
}

const FACE_PROMPT = [
  'You are a strict selfie quality verifier.',
  'Decide whether the image shows exactly one complete, clearly visible human face.',
  'The whole face — forehead, both eyes, nose, mouth and chin — must be inside the frame and in focus.',
  'Set face_visible to false for a half or cropped face, a covered or blurred face, a hand, an object, a group photo, or a photo of a screen.',
  'Return JSON with your decision.',
].join(' ');

const FACE_SCHEMA = {
  type: 'object',
  properties: {
    face_visible: { type: 'boolean' },
    note: { type: 'string' },
  },
  required: ['face_visible'],
};

/** Fotoğrafta tek ve tam bir yüz var mı? Servis hatasında null döner: kullanıcı kilitlenmez. */
async function checkFace(base44, selfieUri) {
  try {
    const url = await signedUrl(base44, selfieUri);
    if (!url) return null;
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: FACE_PROMPT,
      file_urls: [url],
      response_json_schema: FACE_SCHEMA,
    });
    return result?.face_visible !== false;
  } catch {
    return null;
  }
}

const addDevice = (devices: any, deviceId: string) => {
  const list = Array.isArray(devices) ? devices.filter((id: any) => typeof id === 'string' && id) : [];
  if (!deviceId) return list.slice(-DEVICE_LIMIT);
  return [...list.filter((id: string) => id !== deviceId), deviceId].slice(-DEVICE_LIMIT);
};

/** Yayıncı/ajans bağı olan hesap mı? */
const isBroadcaster = (account: any) =>
  !!account && (
    account.broadcaster_status === 'active'
    || account.agency_role === 'broadcaster'
    || account.agency_role === 'owner'
    || account.agency_role === 'assistant'
    || !!account.agency_record_id
    || !!account.agency_name
    || !!account.owned_agency_id
  );

/** Yan hesabın yayıncılığını iptal eder: ajans üyeliği, yayıncı durumu ve rozet temizlenir. */
async function revokeBroadcaster(base44, loser, keeper) {
  const agencyId = loser.agency_record_id || '';
  await base44.asServiceRole.entities.User.update(loser.id, {
    agency_code: '', agency_record_id: '', agency_name: '', agency_owner_id: '', agency_role: '', broadcaster_status: '',
    owned_agency_id: '', owned_agency_code: '', owned_agency_name: '', owned_agency_status: '',
  }).catch(() => {});
  if (agencyId) await refreshAgencyTotals(base44, agencyId).catch(() => {});
  await notifyUser(base44, {
    user_id: loser.id, type: 'security', title: 'Yayıncılık iptal edildi',
    body: 'Aynı yüzle ikinci bir hesap doğrulandığı için bu hesabın ajans üyeliği ve yayıncılığı iptal edildi.',
    link: '/profil',
  }).catch(() => {});
  // Denetim izi: kimin yüzü hangi hesapla eşleşti.
  await base44.asServiceRole.entities.AdminLog.create({
    admin_id: keeper.id, admin_name: keeper.username || keeper.full_name || 'Kullanıcı',
    action: 'Yan hesap: yayıncılık iptal edildi', target: loser.email || loser.id,
    details: `Aynı yüz iki hesapta: ${loser.username || loser.full_name || loser.id}`,
  }).catch(() => {});
}

/**
 * Kayıt anında diğer hesapların referans yüzleriyle karşılaştırır. Eşleşme varsa yeni
 * açılan hesabın yayıncılığı iptal edilir. Karşılaştırma sayısı sınırlıdır.
 */
async function scanDuplicateAccounts(base44, me, myRecord, selfieUri) {
  const all = await base44.asServiceRole.entities.FaceCheck
    .filter({}, '-updated_date', SCAN_LIMIT + 5).catch(() => []);
  const candidates = (all || [])
    .filter((row: any) => row.user_id !== me.id && row.face_uri && row.enabled !== false)
    .slice(0, SCAN_LIMIT);
  for (const candidate of candidates) {
    const match = await compareFaces(base44, candidate.face_uri, selfieUri);
    if (!match || !match.same || match.confidence < DUPLICATE_CONFIDENCE) continue;
    const [mine, their] = await Promise.all([
      base44.asServiceRole.entities.User.get(me.id).catch(() => null),
      base44.asServiceRole.entities.User.get(candidate.user_id).catch(() => null),
    ]);
    if (!mine || !their) continue;
    const mineNewer = new Date(mine.created_date || 0).getTime() >= new Date(their.created_date || 0).getTime();
    const loser = mineNewer ? mine : their;
    const keeper = mineNewer ? their : mine;
    let revoked = false;
    if (isBroadcaster(loser)) {
      await revokeBroadcaster(base44, loser, keeper);
      revoked = true;
    }
    const loserRecord = loser.id === mine.id ? myRecord : candidate;
    await base44.asServiceRole.entities.FaceCheck.update(loserRecord.id, {
      duplicate_of: keeper.id,
      duplicate_at: new Date().toISOString(),
      note: 'Aynı yüz iki hesapta doğrulandı',
      ...(revoked ? { revoked_at: new Date().toISOString() } : {}),
    }).catch(() => {});
    return { matched: true, revoked, confidence: match.confidence };
  }
  return { matched: false, revoked: false };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status');
    const deviceId = String(body.device_id || '').slice(0, 80);
    const displayName = user.username || user.full_name || 'Kullanıcı';
    const record = await faceRecord(base44, user.id);

    if (action === 'status') {
      const enabled = record ? record.enabled !== false : true;
      const devices = Array.isArray(record?.trusted_devices) ? record.trusted_devices : [];
      const balance = Array.isArray(record?.balance_devices) ? record.balance_devices : [];
      return Response.json({
        enabled,
        enrolled: !!record?.face_uri,
        trusted: !enabled || (!!deviceId && devices.includes(deviceId)),
        balance: !enabled || (!!deviceId && balance.includes(deviceId)),
      });
    }

    if (action === 'toggle') {
      const enabled = body.enabled !== false;
      // Açma işleminde yüz doğrulaması en fazla TOGGLE_CHECK_LIMIT kez yeniden istenir.
      const checks = Number(record?.toggle_checks) || 0;
      const askCheck = enabled && checks < TOGGLE_CHECK_LIMIT;
      if (record) {
        await base44.asServiceRole.entities.FaceCheck.update(record.id, enabled
          ? {
            enabled,
            toggle_checks: askCheck ? checks + 1 : checks,
            // Doğrulama istenecekse cihaz güveni sıfırlanır ki yüz yeniden sorulsun.
            ...(askCheck ? { trusted_devices: [], balance_devices: [], last_device: '' } : {}),
          }
          : { enabled });
      } else {
        await base44.asServiceRole.entities.FaceCheck.create({
          user_id: user.id, user_name: displayName, enabled,
          ...(enabled ? { toggle_checks: 1 } : {}),
        });
      }
      return Response.json({ ok: true, enabled, enrolled: !!record?.face_uri, check: askCheck });
    }

    // Kayıt ve doğrulama yüz fotoğrafı ister: yüklenen dosya imzalanabiliyorsa geçerlidir.
    const selfieUri = String(body.face_uri || '');
    if (!selfieUri) return Response.json({ error: 'Fotoğraf bulunamadı.' }, { status: 400 });
    const limited = await rateLimit(base44, `face:${user.id}`, user.id, 30, 3600000);
    if (!limited.allowed) {
      return Response.json({ ok: false, reason: 'busy', error: 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.' });
    }
    const now = new Date().toISOString();
    const devices = addDevice(record?.trusted_devices, deviceId);

    if (action === 'enroll') {
      if (!(await signedUrl(base44, selfieUri))) {
        return Response.json({ error: 'Fotoğraf yüklenemedi, tekrar deneyin.' }, { status: 400 });
      }
      // Referans yüz yalnızca bir kez alınır: yarım görünen yüz kaydedilmez.
      if ((await checkFace(base44, selfieUri)) === false) {
        return Response.json({ ok: false, reason: 'no_face' });
      }
      let target = record;
      if (!target) {
        target = await base44.asServiceRole.entities.FaceCheck.create({
          user_id: user.id, user_name: displayName, face_uri: selfieUri, enabled: true,
          trusted_devices: devices, balance_devices: addDevice([], deviceId),
          verified_at: now, balance_at: now, last_device: deviceId,
        });
      } else {
        await base44.asServiceRole.entities.FaceCheck.update(target.id, {
          // Referans yüz yalnızca bir kez alınır: sonraki kayıtlar onu değiştirmez.
          face_uri: target.face_uri || selfieUri,
          user_name: displayName,
          trusted_devices: devices,
          balance_devices: addDevice(target.balance_devices, deviceId),
          verified_at: now, balance_at: now, last_device: deviceId,
        });
      }
      const duplicate = await scanDuplicateAccounts(base44, user, target, selfieUri);
      return Response.json({ ok: true, enrolled: true, revoked: duplicate.revoked });
    }

    if (action === 'verify') {
      if (!record?.face_uri) return Response.json({ ok: false, reason: 'enroll_required' });
      const scope = body.scope === 'balance' ? 'balance' : 'device';
      const match = await compareFaces(base44, record.face_uri, selfieUri);
      // Karşılaştırma servisi yanıt vermezse erişim kapatılmaz, kullanıcı içeri alınır.
      if (!match) return Response.json({ ok: false, reason: 'unavailable' });
      // Yüz çemberin içinde tam görünmüyorsa deneme sayılmaz: halka kırmızıya döner.
      if (!match.faceVisible) return Response.json({ ok: false, reason: 'no_face' });
      if (!match.same || match.confidence < VERIFY_CONFIDENCE) {
        return Response.json({ ok: false, reason: 'mismatch', confidence: match.confidence });
      }
      await base44.asServiceRole.entities.FaceCheck.update(record.id, scope === 'balance'
        ? { balance_devices: addDevice(record.balance_devices, deviceId), balance_at: now, last_device: deviceId }
        : { trusted_devices: devices, verified_at: now, last_device: deviceId });
      return Response.json({ ok: true, scope });
    }

    return Response.json({ error: 'Bilinmeyen işlem.' }, { status: 400 });
  } catch (e) {
    return Response.json({ error: 'Yüz doğrulama yapılamadı. Lütfen tekrar deneyin.' }, { status: 500 });
  }
}