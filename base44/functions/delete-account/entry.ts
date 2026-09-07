import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { rateLimit } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit: 3 deneme / saat
    const rl = await rateLimit(base44, 'delete-account:' + user.id, user.id, 3, 3600000);
    if (!rl.allowed) return Response.json({ error: 'çok fazla deneme, daha sonra tekrar deneyin' }, { status: 429 });

    const userId = user.id;
    const sr = base44.asServiceRole.entities;

    // Kullanıcıya ait kişisel verileri GDPR uyumlu şekilde temizle
    await sr.Favorite.deleteMany({ user_id: userId }).catch(() => {});
    await sr.WatchHistory.deleteMany({ user_id: userId }).catch(() => {});
    await sr.Watchlist.deleteMany({ user_id: userId }).catch(() => {});
    await sr.Notification.deleteMany({ user_id: userId }).catch(() => {});
    await sr.UserPresence.deleteMany({ user_id: userId }).catch(() => {});
    await sr.UserSession.deleteMany({ user_id: userId }).catch(() => {});
    await sr.DirectMessage.deleteMany({ participants: userId }).catch(() => {});
    await sr.Friendship.deleteMany({ members: userId }).catch(() => {});
    await sr.Payment.deleteMany({ user_id: userId }).catch(() => {});
    await sr.Subscription.deleteMany({ user_id: userId }).catch(() => {});
    await sr.PushSubscription.deleteMany({ user_id: userId }).catch(() => {});
    await sr.SupportTicket.deleteMany({ user_id: userId }).catch(() => {});
    await sr.UserXp.deleteMany({ user_id: userId }).catch(() => {});
    await sr.RoomLevels.deleteMany({ user_id: userId }).catch(() => {});

    // Kullanıcının sahip olduğu odaları kapat
    await sr.Room.deleteMany({ owner_id: userId }).catch(() => {});

    // Son olarak kullanıcı kaydını sil
    await sr.User.delete(userId);

    return Response.json({ ok: true });
  } catch (e) {
    console.error('[delete-account error]', e?.message || String(e), e?.stack || '');
    return Response.json({ error: 'Hesap silinemedi. Lütfen destek ile iletişime geçin.' }, { status: 500 });
  }
}