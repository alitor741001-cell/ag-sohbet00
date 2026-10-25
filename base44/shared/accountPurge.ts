// Hesap silme (GDPR): kullanıcıya ait kişisel veriler temizlenir, veda e-postası gönderilir
// ve kullanıcı kaydı silinir. Hem kullanıcının kendi silme talebi (delete-account) hem de
// Hesap kapatma akışı (delete-account) bu modülü kullanır.
import { accountDeletedEmail } from './membershipEmails.ts';
import { detachAssistant } from './agency.ts';

export async function purgeAccount(base44: any, opts: {
  userId: string;
  email?: string;
  name?: string;
  subject?: string;
}) {
  const { userId, email, name, subject } = opts;
  const sr = base44.asServiceRole.entities;

  await sr.Notification.deleteMany({ user_id: userId }).catch(() => {});
  await sr.UserPresence.deleteMany({ user_id: userId }).catch(() => {});
  await sr.DirectMessage.deleteMany({ participants: userId }).catch(() => {});
  await sr.Friendship.deleteMany({ members: userId }).catch(() => {});
  await sr.Payment.deleteMany({ user_id: userId }).catch(() => {});
  await sr.PushSubscription.deleteMany({ user_id: userId }).catch(() => {});
  await sr.SupportTicket.deleteMany({ user_id: userId }).catch(() => {});
  await sr.UserXp.deleteMany({ user_id: userId }).catch(() => {});
  await sr.RoomLevels.deleteMany({ user_id: userId }).catch(() => {});

  // Yüz doğrulama kaydı hesabıyla birlikte silinir; ajans tarafında asistanlık kalmaz.
  await sr.FaceCheck.deleteMany({ user_id: userId }).catch(() => {});
  await detachAssistant(base44, userId).catch(() => {});

  // Oda içi izler: sohbet satırları, "yazıyor" kaydı, yöneticilik ve katılma istekleri
  await sr.RoomMessage.deleteMany({ user_id: userId }).catch(() => {});
  await sr.RoomTyping.deleteMany({ user_id: userId }).catch(() => {});
  await sr.RoomMod.deleteMany({ user_id: userId }).catch(() => {});

  // Kullanıcının sahip olduğu odaları kapat
  await sr.Room.deleteMany({ owner_id: userId }).catch(() => {});

  // Bulunduğu odalardan anında çıkarılır: açık odalarda hayalet koltuk/izleyici kaydı kalmaz.
  const joinedRooms = await sr.Room.filter({ 'participants.user_id': userId }, '-created_date', 100).catch(() => []);
  for (const room of joinedRooms) {
    const participants = (room.participants || []).filter((person: any) => person.user_id !== userId);
    const seats = (Array.isArray(room.seats) ? room.seats : []).map((seat: any) => (
      seat.user_id === userId ? { ...seat, user_id: '', name: '', avatar: '', frame: '', frame_scale: 100, locked: false, muted: false } : seat
    ));
    await sr.Room.update(room.id, { participants, seats }).catch(() => {});
  }

  // Hesap silindi e-postası, kullanıcı kaydı silinmeden önce gönderilir.
  if (email) {
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: subject || 'Hesabınız Silinmiştir - AG SOHBET',
        body: accountDeletedEmail({ name: name || email }),
        from_name: 'AG SOHBET',
      });
    } catch (e) { console.error('[purge-account email error]', e?.message || String(e)); }
  }

  await sr.User.delete(userId);
  return { ok: true };
}