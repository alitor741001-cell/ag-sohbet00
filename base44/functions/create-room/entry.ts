import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sanitizeText, rateLimit, safeErrorResponse, logSecurity } from '../../shared/security.ts';
import { hasActiveMembership } from '../../shared/membership.ts';
import { HIDDEN_AVATAR_URL, hiddenDisplayName, isHiddenUser } from '../../shared/vip.ts';

async function sha256Hex(salt, pw) {
  const data = new TextEncoder().encode(salt + pw);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    let { name, movie_id, movie_title, password, max_users, chat_enabled, voice_enabled, hidden, room_type, seat_count } = body || {};
    // Sesli sohbet odası: film gerekmez, koltuk düzeni seçilir.
    const isVoiceRoom = room_type === 'voice';
    if (!name || (!isVoiceRoom && !movie_id)) {
      return Response.json({ error: isVoiceRoom ? 'oda ismi gerekli' : 'isim ve film gerekli' }, { status: 400 });
    }

    // Input sanitization
    name = sanitizeText(name, 80);
    movie_title = sanitizeText(movie_title, 200);
    if (!name) return Response.json({ error: 'geçersiz oda adı' }, { status: 400 });

    // Admin rate limit'ten muaf
    if (!hasActiveMembership(user)) return Response.json({ error: 'Aktif üyelik gerekli.' }, { status: 403 });
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
      const rl = await rateLimit(base44, 'create-room:' + user.id, user.id, 5, 600000);
      if (!rl.allowed) return Response.json({ error: 'çok hızlı oda oluşturuyorsunuz, lütfen bekleyin' }, { status: 429 });
    }

    // max_users doğrula
    const mu = Math.min(Math.max(Number(max_users) || 10, 2), 50);

    // Sesli oda koltuk kapasitesi
    const SEAT_OPTIONS = [1, 2, 5, 8, 9, 12, 15, 20, 24];
    const requestedSeats = Number(seat_count) || 0;
    const voiceSeats = SEAT_OPTIONS.includes(requestedSeats) ? requestedSeats : 8;

    // Gizli kullanıcı (VIP10+): kurduğu odada da kimliği görünmez — takma ad ve maskeli profil yazılır.
    const ownerRecord = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
    const ownerHidden = isHiddenUser(ownerRecord || user);
    const owner_name = ownerHidden ? hiddenDisplayName(ownerRecord || user) : (user.username || user.full_name || 'Kullanıcı');
    const owner_avatar = ownerHidden ? HIDDEN_AVATAR_URL : (user.avatar || '');
    // Oluşturan kişi ilk koltuğa oturur.
    const seats = isVoiceRoom
      ? Array.from({ length: voiceSeats }, (_, index) => ({
          index,
          locked: false,
          muted: false,
          ...(index === 0
            ? {
                user_id: user.id,
                name: owner_name,
                avatar: owner_avatar,
                frame: ownerHidden ? '' : (user.profile_frame || ''),
                frame_scale: Number(user.profile_frame_scale) || 100,
              }
            : {}),
        }))
      : [];
    const salt = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
    const hashed = password ? (salt + ':' + await sha256Hex(salt, String(password).slice(0, 100))) : '';

    // Assign lowest available room number among active rooms only
    const activeRooms = await base44.asServiceRole.entities.Room.filter({ status: 'active' }, '-created_date', 500).catch(() => []);
    const usedNumbers = new Set(activeRooms.map((r) => r.room_number || 0));
    let room_number = 1;
    while (usedNumbers.has(room_number)) room_number++;

    // Tek oda kuralı: kişinin aynı anda tek aktif odası olur. Yeni oda açılırken önceki
    // odaları kapatılır; böylece ana sayfada kişi tek odayla ve o anki moduyla görünür.
    await Promise.all(activeRooms
      .filter((r) => r.owner_id === user.id)
      .map(async (r) => {
        await base44.asServiceRole.entities.Room.update(r.id, {
          status: 'closed', is_playing: false, participants: [], recent_participants: []
        }).catch(() => {});
        // Kapanan odanın sohbeti kimseye görünmez: mesajları silinir.
        await base44.asServiceRole.entities.RoomMessage.deleteMany({ room_id: r.id }).catch(() => {});
      }));

    const room = await base44.asServiceRole.entities.Room.create({
      name, movie_id: isVoiceRoom ? 'voice' : movie_id, movie_title: isVoiceRoom ? '' : (movie_title || ''),
      owner_id: user.id, owner_name,
      password: hashed ? 'protected' : '',
      room_number,
      max_users: isVoiceRoom ? Math.min(250, voiceSeats + 50) : mu,
      chat_enabled: chat_enabled !== false,
      voice_enabled: isVoiceRoom ? true : !!voice_enabled,
      room_type: isVoiceRoom ? 'voice' : 'watch',
      seat_count: isVoiceRoom ? voiceSeats : 0,
      seats,
      is_playing: false, current_time: 0, status: 'active', hidden: !!hidden,
      recent_participants: [],
      participants: [{ user_id: user.id, name: owner_name, avatar: owner_avatar, joined_at: new Date().toISOString(), muted: false, speaking: false }]
    });
    if (hashed) {
      await base44.asServiceRole.entities.RoomSecret.create({ room_id: room.id, password_hash: hashed });
    }
    await base44.asServiceRole.entities.RoomMessage.create({
      room_id: room.id, user_id: user.id, user_name: owner_name,
      text: isVoiceRoom ? `${owner_name} sesli odayı kurdu (${voiceSeats} koltuk).` : `${owner_name} odaya katıldı.`, type: 'system'
    });
    return Response.json({ id: room.id });
  } catch (e) {
    return safeErrorResponse(e);
  }
}