// Shared admin notification: creates Notification records for all admins,
// sends Web Push, and sends Telegram message. Used by admin-notify.
import { sendPushToAdmins } from './webPush.ts';
import { sendTelegram } from './telegram.ts';

function sanitize(text: string, max: number) {
  return String(text || '').replace(/[<>]/g, '').slice(0, max);
}

// Telegram HTML modunda değerler şablona gömülür: & < > kaçırılmazsa biçimlendirme enjekte edilir.
function escapeTelegram(value: unknown, max = 300) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, max);
}

export async function notifyAdmins(base44: any, opts: {
  event: string;
  ref_id?: string;
  title: string;
  body?: string;
  link?: string;
  telegram_data?: Record<string, any>;
}) {
  const { event, ref_id, title, body, link, telegram_data } = opts;
  const dedupRefId = ref_id || `${event}:${Date.now()}`;

  // Dedup: skip if same ref_id already processed
  if (ref_id) {
    const existing = await base44.asServiceRole.entities.Notification.filter({ ref_id: dedupRefId }, '-created_date', 1).catch(() => []);
    if (existing && existing.length > 0) return { ok: true, duplicate: true };
  }

  // Find all admin users
  const allUsers = await base44.asServiceRole.entities.User.list(500);
  const adminUsers = allUsers.filter((u: any) => u.role === 'admin');

  const cleanTitle = sanitize(title, 200);
  const cleanBody = sanitize(body || '', 500);
  const cleanLink = sanitize(link || '', 200);

  // Her olay türü için tek bildirim: varsa güncelle, yoksa oluştur
  for (const admin of adminUsers) {
    const existing = await base44.asServiceRole.entities.Notification.filter({ user_id: admin.id, type: event }, '-created_date', 1).catch(() => []);
    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.Notification.update(existing[0].id, {
        title: cleanTitle,
        body: cleanBody,
        link: cleanLink,
        ref_id: dedupRefId,
        read: false,
      }).catch(() => {});
    } else {
      await base44.asServiceRole.entities.Notification.create({
        user_id: admin.id,
        title: cleanTitle,
        body: cleanBody,
        type: event,
        link: cleanLink,
        ref_id: dedupRefId,
      }).catch(() => {});
    }
  }

  const safeTelegram: Record<string, string> = {};
  for (const [key, value] of Object.entries(telegram_data || {})) {
    if (!/^[a-z_]{1,30}$/i.test(key)) continue;
    safeTelegram[key] = escapeTelegram(value);
  }

  // Telegram mesajı tamamlanana kadar beklenir (çağıran bekliyorsa bildirim kaybolmaz).
  await sendTelegram(base44, event, safeTelegram, dedupRefId).catch(() => {});
  // Web Push arka planda gönderilir
  sendPushToAdmins(base44, cleanTitle, cleanBody, cleanLink).catch(() => {});

  return { ok: true, admins: adminUsers.length };
}