import { base44 } from '@/api/base44Client';
import { deferRocketRequests, enqueueRocketRequest } from '@/components/games/rocket/rocketQueue';

const pending = new Map();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export default function rocketRequests(payload) {
  const action = payload.action || 'state';
  const key = JSON.stringify(payload);
  if (pending.has(key)) return pending.get(key);
  const run = async () => {
    // Bahis çekme/iptal en kritik istektir: yoğunlukta ısrarla tekrar denenir.
    // Yoklamalar tekrar denenmez; sıradaki tazeleme durumu zaten eşitler.
    const RETRIES = { cashout: 6, bet: 3, setAutoValue: 2, ledger: 1 };
    const retries = RETRIES[action] ?? 0;
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await enqueueRocketRequest(action, async () => {
          try {
            const response = await base44.functions.invoke('rocket-game', payload);
            return response.data;
          } catch (error) {
            if (error?.response?.status === 429) {
              const seconds = Number(error.response.headers?.['retry-after']);
              // Mola kısa ve sınırlıdır: yalnızca tazeleme istekleri bekler,
              // bahis/çekilme ile uçuş tik'i akmaya devam eder.
              deferRocketRequests(Number.isFinite(seconds) && seconds > 0
                ? Math.min(3000, seconds * 1000) : 1500 + Math.random() * 1000);
            }
            throw error;
          }
        });
      } catch (error) {
        const status = error?.response?.status;
        if ((error.response && status !== 429 && status < 500) || attempt >= retries) throw error;
        // Kural reddi tekrar denenmez; yoğunlukta ise kısa ve dağıtılmış bir
        // molayla hemen tekrar denenir (bekleme sırayı tutmaz, yoklama akmaz).
        await pause(250 + attempt * 400 + Math.random() * 300);
      }
    }
  };
  const result = run().finally(() => pending.delete(key));
  pending.set(key, result);
  return result;
}