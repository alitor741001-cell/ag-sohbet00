import { base44 } from '@/api/base44Client';

// One connection queue for both slots and polling; no overlapping requests.
let tail = Promise.resolve();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export default function rocketRequests(payload) {
  const run = async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const response = await base44.functions.invoke('rocket-game', payload);
        return response.data;
      } catch (error) {
        const status = error?.response?.status;
        const transient = !error?.response || status === 429 || status >= 500;
        // Only idempotent reads/cashouts/settings may retry, never a new bet.
        if (!transient || payload.action === 'bet' || attempt >= 2) throw error;
        const retryAfter = Number(error?.response?.headers?.['retry-after']);
        const wait = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(60000, retryAfter * 1000)
          : status === 429 ? (attempt === 0 ? 5000 : 12000) : (attempt === 0 ? 800 : 2400);
        await pause(wait);
      }
    }
  };
  const result = tail.then(run, run);
  tail = result.catch(() => {});
  return result;
}