// Yoğunluk (rate limit) hatası kısa sürelidir: istek kısa bir molayla tekrar
// denenir. Böylece oyuncunun çekilme/iptal isteği limit yüzünden kaybolmaz.

export function isLimitError(error) {
  return (
    error?.status === 429 ||
    error?.response?.status === 429 ||
    /rate|limit/i.test(error?.message || '')
  );
}

export async function withLimitRetry(run, attempts = 3, base = 300) {
  let last;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      last = error;
      if (!isLimitError(error) || attempt === attempts - 1) throw error;
      // Dağıtılmış bekleme: aynı saniyede tekrar denemeler limiti yeniden doldurmaz.
      await new Promise((resolve) => setTimeout(resolve, base + attempt * 400 + Math.random() * 250));
    }
  }
  throw last;
}