import { base44 } from '@/api/base44Client';

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Oyun isteği: yoğunluk (429) ve sunucu hatası (500/502/503/504) durumunda kısa
    molalarla sessizce tekrar denenir. Böylece oyuncu "çok hızlı oynuyorsun" uyarısı
    görmez; diğer hatalar aynen iletilir (bahis iadesi ve uyarı akışı bozulmaz). */
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export default async function gameRequest(functionName, payload, attempts = 6) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await base44.functions.invoke(functionName, payload);
    } catch (error) {
      const status = error?.response?.status;
      if (!RETRYABLE.has(status) || attempt >= attempts - 1) throw error;
      // Sunucu bekleme süresi bildirdiyse ona uyulur; mola kısa tutulur ki oyun akmaya devam etsin.
      const seconds = Number(error.response.headers?.['retry-after']);
      const wait = Number.isFinite(seconds) && seconds > 0
        ? Math.min(3000, seconds * 1000)
        : 400 + attempt * 500 + Math.random() * 300;
      await pause(wait);
    }
  }
}