import { base44 } from '@/api/base44Client';

const pending = new Map();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Oyun isteği: aynı istek iki kez gitmez, yoğunlukta kısa molalarla tekrar denenir.
    Aksiyon ve oy istekleri tekrar denenir; yoklamalar sıradaki tazeleme ile eşitlenir. */
export default function mafyaRequests(payload) {
  const key = JSON.stringify(payload);
  if (pending.has(key)) return pending.get(key);
  const retriable = payload.action === 'night' || payload.action === 'vote';
  const attempts = retriable ? 3 : 1;
  const run = async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const response = await base44.functions.invoke('mafya-game', payload);
        return response.data;
      } catch (error) {
        const code = error?.response?.status;
        const again = !error.response ? true : code === 429 || code >= 500;
        if (!again || attempt >= attempts - 1) throw error;
        await pause(400 + attempt * 600 + Math.random() * 400);
      }
    }
  };
  const result = run().finally(() => pending.delete(key));
  pending.set(key, result);
  return result;
}