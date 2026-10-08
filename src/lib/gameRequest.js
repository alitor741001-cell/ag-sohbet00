import { base44 } from '@/api/base44Client';

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Oyun isteği: yoğunluk (429) hatası isteği çalıştırmadan reddeder, bu yüzden kısa
    molalarla sessizce tekrar denenir. Böylece oyuncu "çok hızlı oynuyorsun" uyarısı
    görmez; diğer hatalar aynen iletilir (bahis iadesi ve uyarı akışı bozulmaz). */
export default async function gameRequest(functionName, payload, attempts = 4) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await base44.functions.invoke(functionName, payload);
    } catch (error) {
      if (error?.response?.status !== 429 || attempt >= attempts - 1) throw error;
      // Sunucu bekleme süresi bildirdiyse ona uyulur; mola kısa tutulur ki oyun akmaya devam etsin.
      const seconds = Number(error.response.headers?.['retry-after']);
      const wait = Number.isFinite(seconds) && seconds > 0
        ? Math.min(3000, seconds * 1000)
        : 500 + attempt * 700 + Math.random() * 350;
      await pause(wait);
    }
  }
}