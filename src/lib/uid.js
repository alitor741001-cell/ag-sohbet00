/** Her cihazda çalışan benzersiz kimlik üretir.
    Yeni tarayıcılarda crypto.randomUUID kullanılır; eski iOS ve Android sürümlerinde bu
    yöntem bulunmadığı için kimlik zaman damgası ve rastgele sayıdan üretilir. */
export function makeId(prefix = '') {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}${random}`;
}