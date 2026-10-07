/** Destek mesajındaki ek video mu? Eski kayıtlarda tür alanı yok: dosya uzantısından anlaşılır. */
export function isVideoAttachment(message) {
  if (!message?.file_url) return false;
  if (message.media_type === 'video') return true;
  return /\.(mp4|mov|webm|m4v|ogg)(\?|$)/i.test(message.file_url);
}