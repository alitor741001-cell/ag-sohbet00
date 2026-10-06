import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { rateLimit, safeErrorResponse, logSecurity } from '../../shared/security.ts';
import { isModerator, isSiteOwner, immuneToModeration, getRoleInfo, getRoleLabelOverrides, getSpecialFrameInfo } from '../../shared/roles.ts';
import { upsertNotification } from '../../shared/upsertNotification.ts';
import { hasActiveMembership } from '../../shared/membership.ts';
import { HIDDEN_AVATAR_URL, hiddenDisplayName, isHiddenUser } from '../../shared/vip.ts';
import { scoresAfterRoomLeave } from '../../shared/numberBoard.ts';
import { maskRoomIdentities } from '../../shared/hiddenUserRoom.ts';
import { appendRoomLog } from '../../shared/roomLog.ts';

async function sha256Hex(salt, pw) {
  const data = new TextEncoder().encode(salt + pw);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function updatePresenceRoom(base44, userId, roomId) {
  const records = await base44.asServiceRole.entities.UserPresence.filter({ user_id: userId }, '-created_date', 1).catch(() => []);
  if (records[0]) await base44.asServiceRole.entities.UserPresence.update(records[0].id, { current_room_id: roomId || '' }).catch(() => {});
}

function rememberParticipant(room, participant) {
  if (!participant) return room.recent_participants || [];
  const recent = (room.recent_participants || []).filter((item) => item.user_id !== participant.user_id);
  return [{ user_id: participant.user_id, name: participant.name, avatar: participant.avatar || '', joined_at: participant.joined_at || new Date().toISOString(), left_at: new Date().toISOString() }, ...recent].slice(0, 100);
}

function profileFrameMeta(user) {
  const frame = user?.profile_frame || '';
  const automatic = frame.startsWith('lvl_');
  if (!frame || (!automatic && !user?.profile_frame_entrance_enabled)) return '';
  const scale = Math.min(130, Math.max(70, Math.floor(Number(user.profile_frame_scale) || 100)));
  const panX = Math.max(-100, Math.min(100, Math.floor(Number(user.profile_avatar_x) || 0)));
  const panY = Math.max(-100, Math.min(100, Math.floor(Number(user.profile_avatar_y) || 0)));
  return `{{PFRAME|${frame}|${scale}|${panX}|${panY}}}`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { action, room_id, password, target_id } = body || {};
    if (!room_id || !['get', 'join', 'leave', 'kick', 'ban', 'unban', 'set-password', 'set-name', 'toggle-hidden', 'enable-voice', 'toggle-voice', 'toggle-mute', 'toggle-chat', 'chat-ban', 'toggle-approval', 'change-movie', 'assign-mod', 'remove-mod', 'delete-room', 'request-join', 'approve-join', 'reject-join', 'admin-room'].includes(action)) {
      return Response.json({ error: 'invalid request' }, { status: 400 });
    }
    const name = user.username || user.full_name || 'Kullanıcı';
    const room = await base44.asServiceRole.entities.Room.get(room_id).catch(() => null);
    if (!room) return Response.json({ error: 'oda bulunamadı' }, { status: 404 });
    if (room.status === 'closed') return Response.json({ error: 'closed' }, { status: 403 });

    if (action === 'get') {
      const canSeeModeration = room.owner_id === user.id || user.role === 'admin' || user.role === 'moderator' || (room.room_moderators || []).includes(user.id);
      // Gizli kullanıcının eski kayıtlarda kalmış gerçek ismi/fotoğrafı odayla birlikte gönderilmez.
      const masked = maskRoomIdentities(room);
      if (masked.changed) {
        await base44.asServiceRole.entities.Room.update(room_id, {
          participants: masked.room.participants,
          seats: masked.room.seats,
        }).catch(() => {});
      }
      const shown = masked.room;
      return Response.json({
        room: {
          ...shown,
          password: shown.password ? 'protected' : '',
          banned_users: canSeeModeration ? (shown.banned_users || []) : [],
          room_logs: canSeeModeration ? (shown.room_logs || []) : [],
        }
      });
    }

    const me = await base44.entities.User.get(user.id);
    const isAdmin = me.role === 'admin';
    const isMod = isModerator(me);
    const isOwner = room.owner_id === user.id;
    const isRoomMod = (room.room_moderators || []).includes(user.id);
    const canModRoom = isOwner || isMod || isRoomMod;
    const hasVisibleRole = !!(me.display_role || me.custom_role?.name || me.special_frame_id || (me.profile_frame && (me.profile_frame.startsWith('lvl_') || me.profile_frame_entrance_enabled)));
    // Gizli kullanıcı modu (VIP10+): odaya görünmeden katılır — giriş/çıkış bildirimi düşmez.
    const hiddenUser = isHiddenUser(me);
    // Sistem notlarında da kimlik görünmez: gizli kullanıcının adı takma adla, profili maskeli yazılır.
    const noteName = hiddenUser ? hiddenDisplayName(me) : name;
    const noteActor = hiddenUser ? { user_id: '', user_avatar: HIDDEN_AVATAR_URL } : { user_id: user.id, user_avatar: user.avatar || '' };
    const ghost = !isOwner && (hiddenUser || (isAdmin && !hasVisibleRole));
    // Rol etiketleri yalnızca gerekince okunur: oda ayarları ekstra kayıt beklemez.
    let labelOverridesCache: Record<string, string> | null = null;
    const labelOverrides = async () => {
      if (!labelOverridesCache) labelOverridesCache = await getRoleLabelOverrides(base44);
      return labelOverridesCache;
    };

    if ((action === 'join' || action === 'request-join') && !hasActiveMembership(me)) {
      await logSecurity(base44, 'room_join_denied', user, 'membership inactive', 'warning');
      return Response.json({ error: 'aktif üyelik gerekli' }, { status: 403 });
    }

    if (action === 'join') {
      // Rate limit: 10 katılım / dakika / kullanıcı
      const rlJoin = await rateLimit(base44, 'room-join:' + user.id, user.id, 10, 60000);
      if (!rlJoin.allowed) return Response.json({ error: 'çok hızlı katılım denemesi' }, { status: 429 });
      // Yönetici hesabı her odaya girebilir: engel kaydı ve kapasite onu durdurmaz.
      if (!isOwner && !isAdmin) {
        const blockedRelations = await base44.asServiceRole.entities.Friendship.filter({
          $or: [
            { requester_id: user.id, recipient_id: room.owner_id, status: 'blocked' },
            { requester_id: room.owner_id, recipient_id: user.id, status: 'blocked' }
          ]
        }, '-created_date', 1);
        if (blockedRelations.length) {
          return Response.json({ error: 'Bu odanın sahibiyle aranızda engel bulunduğu için odaya katılamazsınız.' }, { status: 403 });
        }
      }
      // Odada hâlihazırda bulunan kişi (sesli/film modu geçişi) yeniden onay beklemez.
      const alreadyInRoom = (room.participants || []).some((p) => p.user_id === user.id);
      // Kişisel oda: sadece onaylı istek sahipleri girebilir (admin/mod hariç)
      // requires_approval kapalıysa doğrudan giriş yapılabilir.
      if (room.is_personal && room.requires_approval !== false && !isOwner && !isMod && !alreadyInRoom) {
        const approvedReq = await base44.asServiceRole.entities.RoomJoinRequest.filter({ room_id, user_id: user.id, status: 'approved' }, '-created_date', 1).catch(() => []);
        const hasApproved = approvedReq && approvedReq.length > 0;
        if (!hasApproved) {
          return Response.json({ error: 'Oda sahibinin onayı gerekli', needsApproval: true }, { status: 403 });
        }
      }
      // Ban check: odadan atılan kişi 24 saat giremez; süre dolunca yasak kendiliğinden kalkar.
      const banNow = Date.now();
      const activeBan = (room.banned_users || []).find((b) => b.user_id === user.id
        && (!b.banned_until || new Date(b.banned_until).getTime() > banNow));
      if (activeBan && !isMod) {
        const remainingHours = activeBan.banned_until
          ? Math.max(1, Math.ceil((new Date(activeBan.banned_until).getTime() - banNow) / 3600000))
          : 0;
        return Response.json({
          error: activeBan.banned_until
            ? `24 saat boyunca bu odaya giremezsiniz. Yaklaşık ${remainingHours} saat sonra tekrar deneyebilirsiniz.`
            : 'Bu odadan atılmışsınız. Tekrar katılamazsınız.',
          banned: true,
        }, { status: 403 });
      }
      // Süresi dolmuş yasak kaydı temizlenir ki kişi yeniden girebilsin.
      const isBanExpired = (room.banned_users || []).some((b) => b.user_id === user.id
        && b.banned_until && new Date(b.banned_until).getTime() <= banNow);
      if (isBanExpired) {
        await base44.asServiceRole.entities.Room.update(room_id, {
          banned_users: (room.banned_users || []).filter((b) => !(b.user_id === user.id && b.banned_until && new Date(b.banned_until).getTime() <= banNow)),
        }).catch(() => {});
      }
      // Gizli kullanıcı (VIP10+): odada kimliği görünmez — anons düşer, isim/avatar/profil gösterilmez.
      if (hiddenUser) {
        const inside = (room.participants || []).some((person) => person.user_id === user.id);
        if (!inside) {
          if ((room.participants || []).length >= (room.max_users || 10) && !isAdmin) {
            return Response.json({ error: 'oda dolu' }, { status: 403 });
          }
          await base44.asServiceRole.entities.Room.update(room_id, {
            participants: [...(room.participants || []), { user_id: user.id, name: hiddenDisplayName(me), avatar: HIDDEN_AVATAR_URL, joined_at: new Date().toISOString(), muted: false, speaking: false }],
            ghost_entered_at: new Date().toISOString(),
          });
        } else {
          // Eski katılım kaydı gerçek isimle kalmış olabilir: takma ada ve maskeli profile çevrilir.
          const maskedParticipants = (room.participants || []).map((person) =>
            (person.user_id === user.id ? { ...person, name: hiddenDisplayName(me), avatar: HIDDEN_AVATAR_URL } : person));
          await base44.asServiceRole.entities.Room.update(room_id, { participants: maskedParticipants, ghost_entered_at: new Date().toISOString() });
        }
        // Gizli kullanıcı yayında görünmez: canlı oda işaretçisi boş bırakılır,
        // arkadaş listesinde "odasında" ve "Katıl" çıkmaz.
        await updatePresenceRoom(base44, user.id, '');
        return Response.json({ ok: true, hidden: true });
      }
      // Admin ghost mode: görünmez katılım
      if (ghost) return Response.json({ ok: true, ghost: true });
      const participants = room.participants || [];
      const already = participants.some((p) => p.user_id === user.id);
      if (!already && room.password && !isOwner && !isMod) {
        const secrets = await base44.asServiceRole.entities.RoomSecret.filter({ room_id }, '-created_date', 1).catch(() => []);
        const storedHash = secrets[0]?.password_hash || '';
        const [salt, hash] = storedHash.split(':');
        if (!password || !salt || hash !== await sha256Hex(salt, password)) {
          await base44.asServiceRole.entities.SecurityLog.create({
            action: 'room_password_failed', user_id: user.id, user_email: user.email,
            detail: room_id, level: 'warning'
          });
          return Response.json({ error: 'hatalı şifre', needsPassword: true }, { status: 403 });
        }
      }
      if (!already) {
        if (participants.length >= (room.max_users || 10) && !isAdmin) {
          return Response.json({ error: 'oda dolu' }, { status: 403 });
        }
        participants.push({ user_id: user.id, name, avatar: user.avatar || '', joined_at: new Date().toISOString(), muted: false, speaking: false });
        await base44.asServiceRole.entities.Room.update(room_id, { participants });
      }
      const roleInfo = getRoleInfo(me, await labelOverrides());
      const frameInfo = await getSpecialFrameInfo(base44, me, true);
      const profileMeta = profileFrameMeta(me);
      if (!already) {
        const roleMeta = roleInfo.label ? `{{ROLE|${roleInfo.key || ''}|${roleInfo.color || ''}|${roleInfo.animation || 'pulse'}}}` : '';
        const frameMeta = frameInfo ? `{{FRAME|${frameInfo.id}|${frameInfo.theme_color}|${frameInfo.text_color}|${frameInfo.glow_color}|${frameInfo.title}}}` : '';
        const titlePrefix = frameInfo?.title
          ? `${frameInfo.title} `
          : (roleInfo.label && roleInfo.show_in_room ? `${roleInfo.icon} ${roleInfo.label} ` : '');
        const entryName = frameInfo ? `${name} ` : (roleInfo.hide_username_entry ? '' : `${name} `);
        await base44.asServiceRole.entities.RoomMessage.create({
          room_id, user_id: user.id, user_name: name, user_avatar: user.avatar || '',
          text: `${profileMeta}${frameMeta}${roleMeta}${titlePrefix}${entryName}odaya katıldı.`, type: 'system'
        });
      }
      // Gizli odada canlı oda işaretçisi yazılmaz: oda kimseye açık görünmez.
      await updatePresenceRoom(base44, user.id, room.hidden === true ? '' : room_id);
      return Response.json({ ok: true });
    }

    // Özel oda katılım isteği gönder
    if (action === 'request-join') {
      if (!room.is_personal) return Response.json({ error: 'bu oda kişisel değil' }, { status: 400 });
      if (isOwner) return Response.json({ ok: true, approved: true });
      if (isMod || isAdmin) return Response.json({ ok: true, approved: true });
      if ((room.participants || []).some((p) => p.user_id === user.id)) return Response.json({ ok: true, approved: true });
      // Zaten onaylı istek varsa direkt katıl
      const existing = await base44.asServiceRole.entities.RoomJoinRequest.filter({ room_id, user_id: user.id }, '-created_date', 5).catch(() => []);
      const approved = existing.find((r) => r.status === 'approved');
      if (approved) return Response.json({ ok: true, approved: true });
      const pending = existing.find((r) => r.status === 'pending');
      if (pending) return Response.json({ ok: true, pending: true });
      // Yeni istek oluştur
      await base44.asServiceRole.entities.RoomJoinRequest.create({
        room_id, room_name: room.name || '',
        user_id: user.id, user_name: name, user_avatar: user.avatar || '',
        owner_id: room.owner_id, status: 'pending'
      });
      // Oda sahibine bildirim (tek kayıt üzerinden güncelle)
      await upsertNotification(base44, {
        user_id: room.owner_id, title: 'Oda katılım isteği',
        body: `${name} odaya katılmak istiyor.`, type: 'room_join_request', link: `/oda/${room_id}`,
        ref_id: room_id
      });
      return Response.json({ ok: true, pending: true });
    }

    // Oda sahibi isteği onayla
    if (action === 'approve-join') {
      if (!isOwner && !isMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const { request_id } = body || {};
      if (!request_id) return Response.json({ error: 'istek gerekli' }, { status: 400 });
      const req = await base44.asServiceRole.entities.RoomJoinRequest.get(request_id).catch(() => null);
      if (!req || req.room_id !== room_id) return Response.json({ error: 'istek bulunamadı' }, { status: 404 });
      await base44.asServiceRole.entities.RoomJoinRequest.update(request_id, { status: 'approved' });
      // Kullanıcıya bildirim (tek kayıt üzerinden güncelle)
      await upsertNotification(base44, {
        user_id: req.user_id, title: 'Oda isteği onaylandı',
        body: `${room.name || 'Oda'} sahibi katılım isteğinizi onayladı.`, type: 'room_join_approved', link: `/oda/${room_id}`,
        ref_id: room_id
      });
      return Response.json({ ok: true });
    }

    // Oda sahibi isteği reddet
    if (action === 'reject-join') {
      if (!isOwner && !isMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const { request_id } = body || {};
      if (!request_id) return Response.json({ error: 'istek gerekli' }, { status: 400 });
      const req = await base44.asServiceRole.entities.RoomJoinRequest.get(request_id).catch(() => null);
      if (!req || req.room_id !== room_id) return Response.json({ error: 'istek bulunamadı' }, { status: 404 });
      await base44.asServiceRole.entities.RoomJoinRequest.update(request_id, { status: 'rejected' });
      await upsertNotification(base44, {
        user_id: req.user_id, title: 'Oda isteği reddedildi',
        body: `${room.name || 'Oda'} sahibi katılım isteğinizi reddetti.`, type: 'room_join_rejected', link: `/oda/${room_id}`,
        ref_id: room_id
      });
      return Response.json({ ok: true });
    }

    if (action === 'kick' || action === 'ban') {
      // Odadan atma ve engelleme: oda sahibi, oda moderatörleri, yönetici rolü ve admin yetkilidir.
      if (!canModRoom) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const targetUser = await base44.asServiceRole.entities.User.get(target_id).catch(() => null);
      // Yönetici hesabı hiçbir koşulda odadan atılamaz ve yasaklanamaz: deneyen kişi uyarılır.
      if (targetUser?.role === 'admin') {
        return Response.json({ error: 'Yönetici hesabı odadan atılamaz.', adminProtected: true }, { status: 403 });
      }
      // Yetki hiyerarşisi: kurucu korunur; admin yardımcısı ve kraliçeyi yalnızca kurucu atabilir.
      const actorRoleKey = me?.display_role || '';
      const targetRoleKey = targetUser?.display_role || '';
      if (targetRoleKey === 'founder') return Response.json({ error: 'Kurucu odadan atılamaz' }, { status: 403 });
      if ((targetRoleKey === 'queen_admin' || targetRoleKey === 'admin_helper') && actorRoleKey !== 'founder') {
        return Response.json({ error: 'Bu rolü yalnızca kurucu odadan atabilir' }, { status: 403 });
      }
      if (immuneToModeration(targetUser) && actorRoleKey !== 'founder') return Response.json({ error: 'Bu kullanıcıyı atamazsınız' }, { status: 403 });
      const targetParticipant = (room.participants || []).find((p) => p.user_id === target_id);
      const participants = (room.participants || []).filter((p) => p.user_id !== target_id);
      const targetName = targetParticipant?.name || 'Kullanıcı';
      // Yumuşak atma (çevrimdışı temizliği): kişi odadan/listedan çıkarılır ama atılmış sayılmaz —
      // yasak kaydı oluşmaz ve kayıt defterindeki "Odadan Atılanlar" listesine yazılmaz.
      const soft = action === 'kick' && body?.soft === true;
      // Odadan atılan kişi bir daha giremez: atma işlemi de yasak kaydı oluşturur.
      // Odadan atılan kişiye 24 saatlik giriş yasağı uygulanır.
      const bannedUsers = [
        {
          user_id: target_id,
          name: targetName,
          banned_at: new Date().toISOString(),
          banned_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        ...(room.banned_users || []).filter((b) => b.user_id !== target_id),
      ];
      let update: any = {
        participants,
        recent_participants: rememberParticipant(room, targetParticipant),
        ...(soft ? {} : {
          banned_users: bannedUsers,
          room_logs: appendRoomLog(room, {
            text: `${name}, ${targetName} kişisini odadan attı ve 24 saat girişini yasakladı.`,
            kind: 'room_kick',
            actor_id: user.id, actor_name: name, target_id, target_name: targetName,
          }),
        }),
      };
      // Sayı tahtası ayarı açıksa odadan atılan kişinin sayısı sıfırlanır
      const kickedScores = scoresAfterRoomLeave(room, target_id);
      if (kickedScores) update.number_scores = kickedScores;
      // Atılan kişiye bildirim: 24 saatlik giriş yasağı bildirimlere de düşer.
      // Yumuşak atmada bildirim gönderilmez, kişi zaten odadan kendi çıkmıştır.
      if (!soft) {
        await upsertNotification(base44, {
          user_id: target_id,
          title: 'Odadan atıldınız',
          body: `${room.name || 'Oda'} odasından atıldınız. 24 saat boyunca bu odaya giremezsiniz.`,
          type: 'room_ban',
          link: room.room_type === 'voice' || room.voice_mode ? `/sesli-oda/${room_id}` : `/oda/${room_id}`,
          ref_id: room_id,
        }).catch(() => {});
      }
      // Odada kimse kalmadıysa oda tamamen silinir (kişisel odalar korunur).
      if (participants.length === 0 && !room.is_personal) {
        await base44.asServiceRole.entities.RoomMessage.deleteMany({ room_id }).catch(() => {});
        await base44.asServiceRole.entities.Room.delete(room_id).catch(() => {});
        return Response.json({ ok: true });
      }
      if (participants.length === 0) {
        update.is_playing = false;
        // Oda kapandı: izleyici listesi ve son katılanlar sıfırlanır.
        update.recent_participants = [];
      }
      await base44.asServiceRole.entities.Room.update(room_id, update);
      return Response.json({ ok: true });
    }

    // Giriş yasağını kaldır — kayıt defterindeki "Odadan Atılanlar" bölümünden yönetilir
    if (action === 'unban') {
      if (!canModRoom) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const removed = (room.banned_users || []).find((b) => b.user_id === target_id);
      const bannedUsers = (room.banned_users || []).filter((b) => b.user_id !== target_id);
      await base44.asServiceRole.entities.Room.update(room_id, {
        banned_users: bannedUsers,
        room_logs: appendRoomLog(room, {
          text: `${name}, ${removed?.name || 'Kullanıcı'} kişisinin giriş yasağını kaldırdı.`,
          kind: 'unban',
          actor_id: user.id, actor_name: name, target_id, target_name: removed?.name || 'Kullanıcı',
        }),
      });
      return Response.json({ ok: true });
    }

    if (action === 'set-password') {
      if (!isOwner && !isMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      if (!password) {
        await base44.asServiceRole.entities.RoomSecret.deleteMany({ room_id }).catch(() => {});
        await base44.asServiceRole.entities.Room.update(room_id, { password: '' });
        return Response.json({ ok: true });
      }
      const salt = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
      const hash = await sha256Hex(salt, password);
      await base44.asServiceRole.entities.RoomSecret.deleteMany({ room_id }).catch(() => {});
      await base44.asServiceRole.entities.RoomSecret.create({ room_id, password_hash: `${salt}:${hash}` });
      await base44.asServiceRole.entities.Room.update(room_id, { password: 'protected' });
      return Response.json({ ok: true });
    }

    if (action === 'toggle-hidden') {
      if (!canModRoom) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const willHide = !room.hidden;
      // Ana sayfada kişi tek odayla görünür: gizleme sahibin tüm aktif odalarını kapsar,
      // "göster" ise yalnızca bu odayı listeye döndürür — geriye tek görünür oda kalır.
      const targets = willHide
        ? await base44.asServiceRole.entities.Room.filter({ owner_id: room.owner_id, status: 'active' }, '-created_date', 20)
        : [room];
      await Promise.all(targets.map((item) => base44.asServiceRole.entities.Room.update(item.id, { hidden: willHide })));
      // Gizlenen oda kimseye "canlı" görünmez, görünür yapılınca yeniden canlı sayılır:
      // içeridekilerin canlı oda işaretçisi buna göre yazılır. İşaretçi tüm uygulamalara
      // anlık yayınlandığı için gizleme/gösterme ana sayfaya anında yansır.
      const insideIds = [...new Set([
        ...(room.participants || []).map((person) => person.user_id),
        ...(room.seats || []).map((seat) => seat.user_id),
      ].filter(Boolean))];
      if (insideIds.length) {
        const records = await base44.asServiceRole.entities.UserPresence
          .filter({ user_id: { $in: insideIds } }, '-created_date', insideIds.length).catch(() => []);
        await Promise.all(records.map((record) => base44.asServiceRole.entities.UserPresence
          .update(record.id, { current_room_id: willHide ? '' : room_id }).catch(() => {})));
      }
      return Response.json({ ok: true, hidden: willHide });
    }

    // Film odasındaki mikrofon: odayı sesli sohbet moduna geçirmeden sesli sohbeti açar.
    if (action === 'enable-voice') {
      if (room.voice_enabled) return Response.json({ ok: true, voice_enabled: true });
      const inRoom = (room.participants || []).some((item) => item.user_id === user.id);
      if (!canModRoom && !inRoom) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      await base44.asServiceRole.entities.Room.update(room_id, { voice_enabled: true });
      return Response.json({ ok: true, voice_enabled: true });
    }

    // Sesli sohbet alanı: açıkken oda sesli sohbet moduna geçer, tekrar basıldığında film odasına dönülür.
    if (action === 'toggle-voice') {
      if (!canModRoom) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const nextVoiceMode = room.voice_mode !== true;
      // Mod değişimi oda türüne de yansır: film odası sesli odaya, sesli oda film odasına çevrilebilir.
      await base44.asServiceRole.entities.Room.update(room_id, { voice_mode: nextVoiceMode, voice_enabled: nextVoiceMode, room_type: nextVoiceMode ? 'voice' : 'watch' });
      await base44.asServiceRole.entities.RoomMessage.create({
        room_id, ...noteActor, user_name: noteName,
        text: nextVoiceMode ? `${noteName} sesli sohbet alanını açtı.` : `${noteName} film odasına döndü.`, type: 'system'
      }).catch(() => {});
      return Response.json({ ok: true, voice_mode: nextVoiceMode, voice_enabled: nextVoiceMode });
    }

    if (action === 'toggle-chat') {
      if (!canModRoom) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      await base44.asServiceRole.entities.Room.update(room_id, { chat_enabled: !room.chat_enabled });
      return Response.json({ ok: true, chat_enabled: !room.chat_enabled });
    }

    // Sohbet yasağı — açıkken yalnızca koltukta oturanlar yazabilir.
    if (action === 'chat-ban') {
      if (!canModRoom) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const bannedNow = body.banned !== false;
      await base44.asServiceRole.entities.Room.update(room_id, { chat_seated_only: bannedNow });
      await base44.asServiceRole.entities.RoomMessage.create({
        room_id, ...noteActor, user_name: noteName,
        text: bannedNow
          ? `${noteName} sohbet yasağını açtı — yalnızca koltuktakiler yazabilir.`
          : `${noteName} sohbet yasağını kaldırdı.`, type: 'system'
      }).catch(() => {});
      return Response.json({ ok: true, chat_seated_only: bannedNow });
    }

    if (action === 'toggle-approval') {
      if (!isOwner && !isMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const next = room.requires_approval === false;
      await base44.asServiceRole.entities.Room.update(room_id, { requires_approval: next });
      // Onay kapatılırsa bekleyen tüm istekleri otomatik onayla ve bildirim gönder
      if (next === false) {
        const pending = await base44.asServiceRole.entities.RoomJoinRequest.filter({ room_id, status: 'pending' }, '-created_date', 100).catch(() => []);
        for (const req of pending) {
          await base44.asServiceRole.entities.RoomJoinRequest.update(req.id, { status: 'approved' }).catch(() => {});
          await upsertNotification(base44, {
            user_id: req.user_id, title: 'Oda isteği onaylandı',
            body: `${room.name || 'Oda'} sahibi katılım isteğinizi onayladı.`, type: 'room_join_approved', link: `/oda/${room_id}`,
            ref_id: room_id
          }).catch(() => {});
        }
      }
      return Response.json({ ok: true, requires_approval: next });
    }

    if (action === 'toggle-mute') {
      if (!canModRoom) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const targetUser = await base44.asServiceRole.entities.User.get(target_id).catch(() => null);
      if (immuneToModeration(targetUser) && !isSiteOwner(me)) return Response.json({ error: 'Bu kullanıcı susturulamaz' }, { status: 403 });
      const participants = (room.participants || []).map((p) =>
        p.user_id === target_id ? { ...p, muted: !p.muted } : p
      );
      await base44.asServiceRole.entities.Room.update(room_id, { participants });
      return Response.json({ ok: true });
    }

    if (action === 'change-movie') {
      const { movie_id, movie_title } = body || {};
      if (!movie_id) return Response.json({ error: 'film gerekli' }, { status: 400 });
      const participants = room.participants || [];
      const inRoom = participants.some((p) => p.user_id === user.id);
      if (!inRoom && !canModRoom) return Response.json({ error: 'odada değilsiniz' }, { status: 403 });
      await base44.asServiceRole.entities.Room.update(room_id, {
        movie_id, movie_title: movie_title || '',
        current_time: 0, is_playing: true,
        last_sync: new Date().toISOString()
      });
      await base44.asServiceRole.entities.RoomMessage.create({
        room_id, ...noteActor, user_name: noteName,
        text: `${noteName} filmi değiştirdi: ${movie_title || 'Yeni Film'}`, type: 'system'
      });
      return Response.json({ ok: true });
    }

    if (action === 'set-name') {
      if (!canModRoom) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const { name: newName } = body || {};
      if (!newName || !newName.trim()) return Response.json({ error: 'isim gerekli' }, { status: 400 });
      const cleanName = newName.trim().slice(0, 80);
      await base44.asServiceRole.entities.Room.update(room_id, { name: cleanName });
      return Response.json({ ok: true });
    }

    if (action === 'assign-mod' || action === 'remove-mod') {
      if (!isOwner && !isMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      if (!target_id) return Response.json({ error: 'kullanıcı gerekli' }, { status: 400 });
      let mods = room.room_moderators || [];
      if (action === 'assign-mod') {
        if (!mods.includes(target_id)) mods = [...mods, target_id];
      } else {
        mods = mods.filter((id) => id !== target_id);
      }
      await base44.asServiceRole.entities.Room.update(room_id, { room_moderators: mods });
      const targetUser = await base44.asServiceRole.entities.User.get(target_id).catch(() => null);
      const targetName = targetUser?.username || targetUser?.full_name || 'Kullanıcı';
      await base44.asServiceRole.entities.RoomMessage.create({
        room_id, user_id: target_id, user_name: targetName,
        text: action === 'assign-mod' ? `${targetName} oda moderatörü yapıldı.` : `${targetName}'in oda moderatörliği kaldırıldı.`, type: 'system'
      }).catch(() => {});
      if (action === 'assign-mod') {
        await upsertNotification(base44, {
          user_id: target_id, title: 'Oda moderatörü oldunuz',
          body: `${room.name} odasında moderatör yetkisi verildi.`, type: 'room_mod_assigned', link: `/oda/${room_id}`,
          ref_id: room_id
        });
        const existingMods = await base44.asServiceRole.entities.RoomMod.filter({ owner_id: room.owner_id, user_id: target_id }, '-created_date', 1).catch(() => []);
        if (!existingMods[0]) {
          await base44.asServiceRole.entities.RoomMod.create({
            owner_id: room.owner_id, user_id: target_id, user_name: targetName
          }).catch(() => {});
        }
      } else {
        await upsertNotification(base44, {
          user_id: target_id, title: 'Oda moderatörliği kaldırıldı',
          body: `${room.name} odasında moderatör yetkiniz kaldırıldı.`, type: 'room_mod_removed', link: `/oda/${room_id}`,
          ref_id: room_id
        });
        await base44.asServiceRole.entities.RoomMod.deleteMany({ owner_id: room.owner_id, user_id: target_id }).catch(() => {});
      }
      return Response.json({ ok: true });
    }

    if (action === 'delete-room') {
      if (!isOwner && !isAdmin) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      await base44.asServiceRole.entities.RoomMessage.deleteMany({ room_id }).catch(() => {});
      await base44.asServiceRole.entities.Room.delete(room_id).catch(() => {});
      return Response.json({ ok: true });
    }

    // Açık odalar listesinden yönetici müdahalesi: oda türünü çevirme ve yönetimi devralma.
    if (action === 'admin-room') {
      if (!isAdmin) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const { task } = body || {};
      if (task === 'film' || task === 'voice') {
        const toVoice = task === 'voice';
        await base44.asServiceRole.entities.Room.update(room_id, {
          room_type: toVoice ? 'voice' : 'watch',
          voice_mode: toVoice,
          voice_enabled: toVoice,
        });
        await base44.asServiceRole.entities.RoomMessage.create({
          room_id, ...noteActor, user_name: noteName,
          text: toVoice ? `${noteName} odayı sesli odaya çevirdi.` : `${noteName} odayı film odasına çevirdi.`, type: 'system'
        });
        return Response.json({ ok: true });
      }
      if (task === 'manage') {
        if (isOwner) return Response.json({ ok: true });
        // Yönetim devralınır: önceki sahip moderatör olarak kalır, oda yöneticiye geçer.
        const previousOwnerId = room.owner_id;
        const keptModerators = Array.from(new Set([...(room.room_moderators || []), previousOwnerId].filter(Boolean))).filter((value) => value !== user.id);
        await base44.asServiceRole.entities.Room.update(room_id, { owner_id: user.id, owner_name: name, room_moderators: keptModerators });
        await base44.asServiceRole.entities.RoomMessage.create({
          room_id, ...noteActor, user_name: noteName,
          text: `${noteName} odanın yönetimini devraldı.`, type: 'system'
        });
        return Response.json({ ok: true });
      }
      return Response.json({ error: 'geçersiz işlem' }, { status: 400 });
    }

    // leave (explicit kontrol — kırılgan varsayılan düşüş yerine)
    if (action !== 'leave') return Response.json({ error: 'geçersiz işlem' }, { status: 400 });
    // Koltuk bırakma: odadan hangi ekrandan çıkılırsa çıkılsın kişi koltukta kalmaz.
    // Koltuk listesi yazmadan hemen önce tazelenir: istek başlarken alınan eski kayıt
    // arada koltuğa oturan başka birinin yerini silmez.
    const freshRoom = await base44.asServiceRole.entities.Room.get(room_id).catch(() => room);
    const freshSeats = Array.isArray(freshRoom?.seats) ? freshRoom.seats : [];
    if (freshSeats.some((seat) => seat.user_id === user.id)) {
      await base44.asServiceRole.entities.Room.update(room_id, {
        seats: freshSeats.map((seat) => (seat.user_id === user.id
          ? { index: seat.index, user_id: '', name: '', avatar: '', frame: '', frame_scale: 100, locked: !!seat.locked, muted: false }
          : seat)),
      }).catch(() => {});
    }
    // Gizli kullanıcı çıkışı: anons kapanır, çıkışı ismiyle sohbete yazılmaz.
    if (hiddenUser) await base44.asServiceRole.entities.Room.update(room_id, { ghost_entered_at: '' }).catch(() => {});
    await updatePresenceRoom(base44, user.id, '');
    // Hayalet yönetici katılım listesine hiç girmez: oda/sohbet kaydı temizlenmez, yalnızca izleri bırakılır.
    if (ghost) return Response.json({ ok: true });
    // Kişisel oda: kullanıcı ayrıldığında onay kaydını sil, tekrar katılmak için yeniden onay istesin
    if (room.is_personal && !isOwner && !isMod) {
      await base44.asServiceRole.entities.RoomJoinRequest.deleteMany({ room_id, user_id: user.id }).catch(() => {});
    }
    const leavingParticipant = (room.participants || []).find((p) => p.user_id === user.id);
    const recentParticipants = rememberParticipant(room, leavingParticipant);
    let participants = (room.participants || []).filter((p) => p.user_id !== user.id);
    // Oda sahibi çıkıyor ve katılımcı varsa: online kontrolü atla, oda açık kalsın
    const isOwnerLeavingWithParticipants = isOwner && participants.length > 0 && !room.is_personal;
    // Çevrim içi katılımcı yoksa odayı kapat (sadece sahipsiz çıkışlarda)
    // N+1 önleme: tüm katılımcıların presence kayıtlarını tek sorguda çek
    if (!isOwnerLeavingWithParticipants && participants.length > 0 && !room.is_personal) {
      let hasOnline = false;
      try {
        const presenceRecords = await base44.asServiceRole.entities.UserPresence.filter(
          { user_id: { $in: participants.map((p) => p.user_id) } },
          '-created_date', participants.length
        ).catch(() => []);
        const now = Date.now();
        hasOnline = presenceRecords.some((rec) => rec.online && rec.last_seen && now - new Date(rec.last_seen).getTime() < 30000);
      } catch {
        hasOnline = true; // sorgu başarısız olursa odayı kapatma (güvenli fallback)
      }
      if (!hasOnline) participants = [];
    }
    // Sayı tahtası ayarı açıksa odadan çıkan kişinin sayısı sıfırlanır
    const leaveScores = scoresAfterRoomLeave(room, user.id);
    if (participants.length === 0) {
      if (room.is_personal) {
        // Oda kapandı: izleyici listesi ve son katılanlar sıfırlanır.
        await base44.asServiceRole.entities.Room.update(room_id, { participants, recent_participants: [], is_playing: false, ...(leaveScores ? { number_scores: leaveScores } : {}) });
      } else {
        // Odada kimse kalmadı: oda ve sohbeti tamamen silinir.
        await base44.asServiceRole.entities.RoomMessage.deleteMany({ room_id }).catch(() => {});
        await base44.asServiceRole.entities.Room.delete(room_id).catch(() => {});
        return Response.json({ ok: true });
      }
      const roleInfoLeave = getRoleInfo(me, await labelOverrides());
      const roleMetaLeave = roleInfoLeave.label ? `{{ROLE|${roleInfoLeave.key || ''}|${roleInfoLeave.color || ''}|${roleInfoLeave.animation || 'pulse'}}}` : '';
      const profileMetaLeave = profileFrameMeta(me);
      const frameInfoLeave = await getSpecialFrameInfo(base44, me, false);
      const frameMetaLeave = frameInfoLeave ? `{{FRAME|${frameInfoLeave.id}|${frameInfoLeave.theme_color}|${frameInfoLeave.text_color}|${frameInfoLeave.glow_color}|${frameInfoLeave.title}}}` : '';
      const titlePrefixLeave = frameInfoLeave?.title
        ? `${frameInfoLeave.title} `
        : (roleInfoLeave.label && roleInfoLeave.show_in_room ? `${roleInfoLeave.icon} ${roleInfoLeave.label} ` : '');
      const leaveName = frameInfoLeave ? `${name} ` : (roleInfoLeave.hide_username_entry ? '' : `${name} `);
      if (!hiddenUser && leavingParticipant) {
        await base44.asServiceRole.entities.RoomMessage.create({
          room_id, user_id: user.id, user_name: name, user_avatar: user.avatar || '',
          text: `${profileMetaLeave}${frameMetaLeave}${roleMetaLeave}${titlePrefixLeave}${leaveName}odadan ayrıldı.`, type: 'system'
        });
      }
      return Response.json({ ok: true });
    }
    // Oda sahibi odadan çıksa bile sahiplik odayı açan kişide kalır.
    await base44.asServiceRole.entities.Room.update(room_id, {
      participants, recent_participants: recentParticipants,
      is_playing: participants.length === 0 ? false : room.is_playing,
      last_sync: new Date().toISOString(),
      ...(leaveScores ? { number_scores: leaveScores } : {})
    });
    const roleInfoLeave2 = getRoleInfo(me, await labelOverrides());
    const roleMetaLeave2 = roleInfoLeave2.label ? `{{ROLE|${roleInfoLeave2.key || ''}|${roleInfoLeave2.color || ''}|${roleInfoLeave2.animation || 'pulse'}}}` : '';
    const profileMetaLeave2 = profileFrameMeta(me);
    const frameInfoLeave2 = await getSpecialFrameInfo(base44, me, false);
    const frameMetaLeave2 = frameInfoLeave2 ? `{{FRAME|${frameInfoLeave2.id}|${frameInfoLeave2.theme_color}|${frameInfoLeave2.text_color}|${frameInfoLeave2.glow_color}|${frameInfoLeave2.title}}}` : '';
    const titlePrefixLeave2 = frameInfoLeave2?.title
      ? `${frameInfoLeave2.title} `
      : (roleInfoLeave2.label && roleInfoLeave2.show_in_room ? `${roleInfoLeave2.icon} ${roleInfoLeave2.label} ` : '');
    const leaveName2 = frameInfoLeave2 ? `${name} ` : (roleInfoLeave2.hide_username_entry ? '' : `${name} `);
    if (!hiddenUser && leavingParticipant) {
        await base44.asServiceRole.entities.RoomMessage.create({
          room_id, user_id: user.id, user_name: name, user_avatar: user.avatar || '',
          text: `${profileMetaLeave2}${frameMetaLeave2}${roleMetaLeave2}${titlePrefixLeave2}${leaveName2}odadan ayrıldı.`, type: 'system'
        });
      }
    return Response.json({ ok: true });
  } catch (e) {
    return safeErrorResponse(e);
  }
}