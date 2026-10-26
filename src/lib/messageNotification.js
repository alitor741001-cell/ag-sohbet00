export default function isMessageNotification(notification) {
  const type = String(notification?.type || '');
  const ref = String(notification?.ref_id || '');
  const link = String(notification?.link || '');
  return type === 'dm' || type.startsWith('support') || ref.startsWith('support') || /^\/(?:admin\/)?destek(?:[/?#]|$)/.test(link);
}