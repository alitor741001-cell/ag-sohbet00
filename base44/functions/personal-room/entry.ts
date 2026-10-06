import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sanitizeText } from '../../shared/security.ts';
import { HIDDEN_AVATAR_URL, hiddenDisplayName, isHiddenUser } from '../../shared/vip.ts';

async function sha256Hex(salt, pw) {
  const data = new TextEncoder().encode(salt + pw);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Kişisel oda: kullanıcının kalıcı odası. Kurulumda bir kez girilen bilgiler (oda adı, şifre,
 * kapasite ve seçenekler) bu odaya uygulanır; sonraki açılışlarda aynı oda bu bilgilerle gelir.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const raw = body?.settings && typeof body.settings === 'object' ? body.settings : null;
    // Kaydedilmiş oda bilgileri: yalnızca gönderilen alanlara dokunulur, gönderilmeyen ayar korunur.
    const settings = raw ? {
      name: typeof raw.name === 'string' ? sanitizeText(raw.name, 80) : '',
      chat_enabled: 'chat_enabled' in raw ? raw.chat_enabled !== false : null,
      hidden: 'hidden' in raw ? !!raw.hidden : null,
      password: 'password' in raw ? String(raw.password || '').slice(0, 100) : null,
      seat_count: 'seat_count' in raw ? Number(raw.seat_count) || 0 : null,
    } : null;
    // Kişisel odada kapasite sorulmaz: herkes girebilir, pratikte sınırsız.
    const PERSONAL_MAX_USERS = 250;
    // Kurulumda seçilen sesli bölüm (mikrofon koltukları) odaya işlenir; oda içinden değiştirilebilir.
    const SEAT_OPTIONS = [1, 2, 5, 8, 9, 12, 15, 20, 24];
    const requestedSeats = Number(settings?.seat_count) || 0;
    const voiceSeats = SEAT_OPTIONS.includes(requestedSeats) ? requestedSeats : 0;
    const buildSeats = (count) => Array.from({ length: count }, (_, index) => ({ index, locked: false, muted: false }));

    // Gizli kullanıcı (VIP10+): kişisel odasında da kimliği görünmez.
    const ownerRecord = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
    const ownerHidden = isHiddenUser(ownerRecord || user);
    const owner_name = ownerHidden ? hiddenDisplayName(ownerRecord || user) : (user.username || user.full_name || 'Kullanıcı');
    const owner_avatar = ownerHidden ? HIDDEN_AVATAR_URL : (user.avatar || '');

    // Oda şifresi: kayıtlı şifre varsa gizli kayda yazılır, şifre kaldırıldıysa kayıt silinir.
    const applyPassword = async (roomId, patch) => {
      const secrets = await base44.asServiceRole.entities.RoomSecret.filter({ room_id: roomId }, '-created_date', 5).catch(() => []);
      if (!settings.password) {
        await Promise.all(secrets.map((s) => base44.asServiceRole.entities.RoomSecret.delete(s.id).catch(() => {})));
        patch.password = '';
        return;
      }
      const salt = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
      const hashed = salt + ':' + await sha256Hex(salt, settings.password);
      if (secrets[0]) await base44.asServiceRole.entities.RoomSecret.update(secrets[0].id, { password_hash: hashed });
      else await base44.asServiceRole.entities.RoomSecret.create({ room_id: roomId, password_hash: hashed });
      patch.password = 'protected';
    };

    // Kullanıcının kişisel odası var mı kontrol et
    const existing = await base44.asServiceRole.entities.Room.filter({
      is_personal: true, owner_id: user.id, status: 'active'
    }, '-created_date', 10).catch(() => []);

    // Tek kişisel oda kuralı: fazlası varsa kapat
    if (existing.length > 1) {
      await Promise.all(existing.slice(1).map((r) =>
        base44.asServiceRole.entities.Room.update(r.id, { status: 'closed', is_playing: false, recent_participants: [] }).catch(() => {})
      ));
    }

    // Tek oda kuralı: kişisel oda açılırken sahibin diğer aktif odaları (sesli oda vb.)
    // kapatılır; ana sayfada kişi tek odayla ve o anki moduyla görünür.
    const ownerRooms = await base44.asServiceRole.entities.Room
      .filter({ owner_id: user.id, status: 'active' }, '-created_date', 30).catch(() => []);
    await Promise.all(ownerRooms
      .filter((r) => !r.is_personal)
      .map((r) => base44.asServiceRole.entities.Room.update(r.id, {
        status: 'closed', is_playing: false, participants: [], recent_participants: []
      }).catch(() => {})));

    if (existing[0]) {
      // Eski odada kod yoksa ekle
      if (!existing[0].personal_room_code) {
        const meExisting = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
        let codeExisting = meExisting?.personal_room_code || '';
        if (!codeExisting) {
          codeExisting = String(Math.floor(10000000 + Math.random() * 90000000));
          await base44.asServiceRole.entities.User.update(user.id, { personal_room_code: codeExisting }).catch(() => {});
        }
        await base44.asServiceRole.entities.Room.update(existing[0].id, { personal_room_code: codeExisting }).catch(() => {});
      }
      // Her açılış görünür başlar; önceki oturumun gizli durumu taşınmaz.
      const patch = { max_users: PERSONAL_MAX_USERS, hidden: settings?.hidden ?? false };
      if (settings) {
        if (settings.name) patch.name = settings.name;
        if (settings.chat_enabled !== null) patch.chat_enabled = settings.chat_enabled;
        if (settings.password !== null) await applyPassword(existing[0].id, patch);
        // Koltuk düzeni yalnızca oda hiç kurulmamışsa yazılır: içeride yapılan değişiklik korunur.
        if (voiceSeats && !(existing[0].seats || []).length) {
          patch.seat_count = voiceSeats;
          patch.seats = buildSeats(voiceSeats);
        }
      }
      await base44.asServiceRole.entities.Room.update(existing[0].id, patch);
      return Response.json({ id: existing[0].id });
    }

    // Kullanıcının kalıcı oda kodunu al veya oluştur
    const me = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
    let personalRoomCode = me?.personal_room_code || '';
    if (!personalRoomCode) {
      personalRoomCode = String(Math.floor(10000000 + Math.random() * 90000000));
      await base44.asServiceRole.entities.User.update(user.id, { personal_room_code: personalRoomCode }).catch(() => {});
    }

    // Yeni kişisel oda oluştur
    const savedMods = await base44.asServiceRole.entities.RoomMod.filter({ owner_id: user.id }, '-created_date', 100).catch(() => []);
    const room_moderators = savedMods.map((m) => m.user_id);
    const room = await base44.asServiceRole.entities.Room.create({
      name: settings?.name || `${owner_name}'in Odası`,
      movie_id: '',
      movie_title: '',
      owner_id: user.id,
      owner_name,
      is_personal: true,
      room_number: 0,
      personal_room_code: personalRoomCode,
      max_users: PERSONAL_MAX_USERS,
      chat_enabled: settings?.chat_enabled ?? true,
      password: '',
      voice_enabled: true,
      seat_count: voiceSeats,
      seats: voiceSeats ? buildSeats(voiceSeats) : [],
      is_playing: false,
      current_time: 0,
      status: 'active',
      hidden: settings?.hidden ?? false,
      room_moderators,
      chat_auto_delete_minutes: 3,
      chat_auto_delete_at: new Date(Date.now() + 3 * 60000).toISOString(),
      recent_participants: [],
      participants: [{ user_id: user.id, name: owner_name, avatar: owner_avatar, joined_at: new Date().toISOString(), muted: false, speaking: false }]
    });

    // Kurulumda şifre girildiyse odaya işlenir.
    if (settings?.password) {
      const patch = {};
      await applyPassword(room.id, patch);
      await base44.asServiceRole.entities.Room.update(room.id, patch).catch(() => {});
    }

    await base44.asServiceRole.entities.RoomMessage.create({
      room_id: room.id, user_id: user.id, user_name: owner_name,
      text: `${owner_name} kişisel odasını açtı.`, type: 'system'
    });

    return Response.json({ id: room.id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}