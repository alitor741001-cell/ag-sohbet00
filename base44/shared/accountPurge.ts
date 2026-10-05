// Hesap silme (GDPR): kullanıcıya ait kişisel veriler temizlenir, veda e-postası gönderilir
// ve kullanıcı kaydı silinir. Hem kullanıcının kendi silme talebi (delete-account) hem de
// canlı görüntülü arama ihlali sonrası hesap kapatma (call-moderation) bu modülü kullanır.
import { accountDeletedEmail } from './membershipEmails.ts';

export async function purgeAccount(base44: any, opts: {
  userId: string;
  email?: string;
  name?: string;
  subject?: string;
}) {
  const { userId, email, name, subject } = opts;
  const sr = base44.asServiceRole.entities;

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

  // Hesap silindi e-postası, kullanıcı kaydı silinmeden önce gönderilir.
  if (email) {
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: subject || 'Hesabınız Silinmiştir - FILMKEYFİ',
        body: accountDeletedEmail({ name: name || email }),
        from_name: 'FILMKEYFİ',
      });
    } catch (e) { console.error('[purge-account email error]', e?.message || String(e)); }
  }

  await sr.User.delete(userId);
  return { ok: true };
}