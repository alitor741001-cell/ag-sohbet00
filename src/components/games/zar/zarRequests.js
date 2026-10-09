import { base44 } from '@/api/base44Client';

const pending = new Map();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Tur isteği: aynı istek iki kez gitmez, bahis yoğunlukta kısa molalarla tekrar denenir.
export default function zarRequests(payload) {
  const key = JSON.stringify(payload);
  if (pending.has(key)) return pending.get(key);
  // Yoklamalar tekrar denenmez; sıradaki tazeleme durumu zaten eşitler.
  const attempts = payload.action === 'bet' ? 3 : 1;
  const run = async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const response = await base44.functions.invoke('zar-game', payload);
        return response.data;
      } catch (error) {
        const code = error?.response?.status;
        const retriable = !error.response || code === 429 || code >= 500;
        if (!retriable || attempt >= attempts - 1) throw error;
        await pause(400 + attempt * 600 + Math.random() * 400);
      }
    }
  };
  const result = run().finally(() => pending.delete(key));
  pending.set(key, result);
  return result;
}