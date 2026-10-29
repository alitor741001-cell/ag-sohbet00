// Android cihazlar mikrofon iznini yalnızca doğrudan dokunuşta gösterir ve izin
// durumu "prompt" iken sessizce reddedilmiş sayılır. Bu ayrım izin akışında kullanılır.
export default function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android/i.test(ua) || /Linux; Android/i.test(navigator.platform || '');
}