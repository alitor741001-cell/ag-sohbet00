import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { AccessToken } from 'npm:livekit-server-sdk@2.18.0';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });

    const body = await req.json();
    const displayName = String(body.participantName || user.full_name || 'Kullanıcı').trim().slice(0, 80);

    // Birebir arama: katılımcı ve durum doğrulanır, LiveKit odası arama kaydından türetilir.
    const callId = String(body.callId || '').trim();
    if (callId) {
      const call = await base44.entities.DirectCall.get(callId).catch(() => null);
      if (!call) return Response.json({ error: 'Arama bulunamadı.' }, { status: 404 });
      const isCaller = call.caller_id === user.id;
      const isCallee = call.callee_id === user.id;
      if (!isCaller && !isCallee) return Response.json({ error: 'Bu aramaya erişiminiz yok.' }, { status: 403 });
      if (!['ringing', 'accepted'].includes(call.status)) return Response.json({ error: 'Arama sona erdi.' }, { status: 409 });

      const livekitRoom = `filmkeyfi-call-${call.id}`;
      const callToken = new AccessToken(secrets.get('LIVEKIT_API_KEY'), secrets.get('LIVEKIT_API_SECRET'), {
        identity: user.id,
        name: displayName,
        ttl: '2h',
      });
      callToken.addGrant({ roomJoin: true, room: livekitRoom, canPublish: true, canSubscribe: true });

      return Response.json({
        token: await callToken.toJwt(),
        url: secrets.get('LIVEKIT_URL'),
        roomName: livekitRoom,
      });
    }

    const roomName = body.roomName;
    if (typeof roomName !== 'string' || !roomName.trim() || roomName.length > 100) {
      return Response.json({ error: 'Geçersiz oda.' }, { status: 400 });
    }

    const room = await base44.entities.Room.get(roomName.trim());
    const mayJoin = room.owner_id === user.id || ['admin', 'moderator'].includes(user.role) ||
      (room.participants || []).some((participant) => participant.user_id === user.id);
    if (!mayJoin || room.status !== 'active' || !room.voice_enabled) {
      return Response.json({ error: 'Sesli odaya erişiminiz yok.' }, { status: 403 });
    }

    const livekitRoom = `filmkeyfi-${room.id}`;
    const token = new AccessToken(secrets.get('LIVEKIT_API_KEY'), secrets.get('LIVEKIT_API_SECRET'), {
      identity: user.id,
      name: displayName,
      ttl: '2h',
    });
    token.addGrant({ roomJoin: true, room: livekitRoom, canPublish: true, canSubscribe: true });

    return Response.json({
      token: await token.toJwt(),
      url: secrets.get('LIVEKIT_URL'),
      roomName: livekitRoom,
    });
  } catch (error) {
    console.error('[LiveKit Token]', error);
    return Response.json({ error: 'Ses bağlantısı hazırlanamadı.' }, { status: 500 });
  }
}