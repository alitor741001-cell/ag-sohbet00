import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { AccessToken } from 'npm:livekit-server-sdk@2.18.0';

// LiveKit anahtarları yalnızca sunucuda okunur; istemciye asla gönderilmez.
const LIVEKIT_URL = Deno.env.get('LIVEKIT_URL') || '';
const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY') || '';
const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET') || '';

const TOKEN_TTL_SECONDS = 60 * 60 * 2;

const isModeratorRole = (role?: string) => role === 'admin' || role === 'moderator';

/**
 * Sesli oda katılım jetonu üretir.
 * Kimlik ve oda yetkisi burada doğrulanır; istemci yalnızca imzalı jetonu ve
 * herkese açık LiveKit adresini alır — API anahtarı/parolası istemciye gitmez.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });

    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return Response.json({ error: 'Ses sunucusu yapılandırılmadı. Yönetici LiveKit anahtarlarını eklemeli.' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));

    // Görüntülü PK: sesli odadan bağımsız, yalnızca maçın iki tarafına açık ayrı bir
    // LiveKit odası verilir. Oda kimliği maç kimliğinden türetilir: her PK oturumu tektir.
    const pkMatchId = typeof body?.pk_match_id === 'string' ? body.pk_match_id : '';
    if (pkMatchId) {
      const match = await base44.asServiceRole.entities.PkMatch.get(pkMatchId).catch(() => null);
      if (!match) return Response.json({ error: 'PK oturumu bulunamadı.' }, { status: 404 });
      if (match.host_id !== user.id && match.guest_id !== user.id) {
        return Response.json({ error: 'Bu PK oturumunun katılımcısı değilsin.' }, { status: 403 });
      }

      const pkName = user.full_name || 'Kullanıcı';
      const pkToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity: user.id,
        name: pkName,
        ttl: TOKEN_TTL_SECONDS,
        metadata: JSON.stringify({ role: 'pk' }),
      });
      const pkRoom = `pk_${match.id}`;
      pkToken.addGrant({
        roomJoin: true,
        room: pkRoom,
        canPublish: true,
        canSubscribe: true,
        canPublishData: false,
      });

      return Response.json({ token: await pkToken.toJwt(), url: LIVEKIT_URL, room: pkRoom, identity: user.id, name: pkName });
    }

    const roomId = typeof body?.room_id === 'string' ? body.room_id : '';
    if (!roomId) return Response.json({ error: 'Oda belirtilmedi.' }, { status: 400 });

    const [room, me] = await Promise.all([
      base44.asServiceRole.entities.Room.get(roomId).catch(() => null),
      base44.asServiceRole.entities.User.get(user.id).catch(() => null),
    ]);
    if (!room) return Response.json({ error: 'Oda bulunamadı.' }, { status: 404 });
    // Sesli odalar, sesli moda alınmış film odaları ve film odasında sesli sohbeti
    // açılmış odalar aynı LiveKit altyapısını kullanır.
    const voiceAllowed = room.room_type === 'voice' || room.voice_mode === true || room.voice_enabled === true;
    if (!voiceAllowed) {
      return Response.json({ error: 'Bu odada sesli sohbet yok.' }, { status: 400 });
    }
    if (room.status === 'closed') return Response.json({ error: 'Oda kapatıldı.' }, { status: 403 });

    const isOwner = room.owner_id === user.id;
    const canMod = isOwner || (room.room_moderators || []).includes(user.id) || isModeratorRole(me?.role || user.role);
    const isParticipant = (room.participants || []).some((person: any) => person.user_id === user.id);

    if ((room.banned_users || []).includes(user.id) && !isOwner) {
      return Response.json({ error: 'Bu odadan çıkarıldınız.' }, { status: 403 });
    }
    // Şifreli oda: şifreyi geçmemiş kişi ses odasına bağlanamaz.
    if (room.password && !isParticipant && !canMod) {
      return Response.json({ error: 'Önce odaya katılmalısın.' }, { status: 403 });
    }

    const displayName = me?.username || me?.full_name || user.full_name || 'Kullanıcı';
    const accessToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: user.id,
      name: displayName,
      ttl: TOKEN_TTL_SECONDS,
      metadata: JSON.stringify({ role: canMod ? 'owner' : 'listener' }),
    });
    accessToken.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
    });

    return Response.json({
      token: await accessToken.toJwt(),
      url: LIVEKIT_URL,
      room: roomId,
      identity: user.id,
      name: displayName,
      canModerate: !!canMod,
    });
  } catch (error) {
    console.error('livekit-token', error);
    return Response.json({ error: 'Ses bağlantısı anahtarı oluşturulamadı.' }, { status: 500 });
  }
}