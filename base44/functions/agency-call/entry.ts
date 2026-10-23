import { createClientFromRequest } from 'npm:@base44/sdk@0.8.56';
import { activeAssistant, nextDayResetIso, todayKey } from '../../shared/agency.ts';

const LIMITS = { owner: 6, assistant: 3 };

/**
 * Çağrının alıcıları: ajansın sahibi, asistanları ve yayıncı üyeleri.
 * Ajanssız yönetici çağrısı tüm uygulamaya duyurulur.
 */
async function agencyAudience(db: any, agency: any) {
  if (!agency?.id || agency.id === 'admin') return { ids: [], all: true };
  const record = await db.Agency.get(agency.id).catch(() => null);
  const members = await db.User.filter({ agency_record_id: agency.id }, '-created_date', 500).catch(() => []);
  const ids = new Set<string>();
  if (record?.owner_id) ids.add(record.owner_id);
  (record?.assistants || []).forEach((row: any) => { if (row?.user_id) ids.add(row.user_id); });
  (members || []).forEach((row: any) => { if (row?.id) ids.add(row.id); });
  return { ids: [...ids], all: false };
}

/** Ajans çağrısı: ajans sahibi günde 6, asistan günde 3 kez odaya davet yayınlar. */
export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Oturum gerekli' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const db = base44.asServiceRole.entities;

  const owned = await db.Agency.filter({ owner_id: user.id, status: 'active' }, '-created_date', 1).catch(() => []);
  let agency = owned?.[0] || null;
  let role: 'owner' | 'assistant' = 'owner';
  if (!agency) {
    const rows = await db.Agency.filter({ 'assistants.user_id': user.id }, '-created_date', 5).catch(() => []);
    agency = (rows || []).find((row: any) => row.status === 'active' && activeAssistant(row, user.id)) || null;
    role = 'assistant';
  }
  // Admin hesaplar ajansı olmasa da ajans sahibi hakkıyla çağrı atabilir.
  if (!agency && user.role === 'admin') { agency = { id: 'admin', name: 'AG SOHBET' }; role = 'owner'; }
  if (!agency) return Response.json({ eligible: false });

  const day = todayKey();
  const used = await db.AgencyCall.filter({ sender_id: user.id, day }, '-created_date', 10).catch(() => []);
  const limit = LIMITS[role];
  const remaining = Math.max(0, limit - (used?.length || 0));
  const resetsAt = nextDayResetIso();
  if (body.action !== 'send') return Response.json({ eligible: true, role, limit, remaining, resets_at: resetsAt, agency_name: agency.name });

  if (remaining <= 0) return Response.json({ error: `Bugünkü ${limit} çağrı hakkın doldu.` }, { status: 429 });
  const roomId = String(body.room_id || '');
  const room = roomId ? await db.Room.get(roomId).catch(() => null) : null;
  if (!room) return Response.json({ error: 'Oda bulunamadı' }, { status: 404 });
  const account = await db.User.get(user.id).catch(() => null);
  // Çağrıyı yalnızca o ajansın üyeleri görür: alıcı listesi gönderim anında yazılır.
  const audience = await agencyAudience(db, agency);
  await db.AgencyCall.create({
    agency_id: agency.id, agency_name: agency.name, room_id: room.id, room_name: room.name || '',
    sender_id: user.id, sender_name: account?.username || account?.full_name || 'Kullanıcı',
    sender_avatar: account?.avatar_url || account?.avatar || '', sender_role: role,
    message: String(body.message || '').trim().slice(0, 200), day,
    audience_ids: audience.ids, audience_all: audience.all,
  });
  return Response.json({ eligible: true, role, limit, remaining: remaining - 1, resets_at: resetsAt });
}