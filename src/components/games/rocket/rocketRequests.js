import { base44 } from '@/api/base44Client';
import { deferRocketRequests, enqueueRocketRequest } from '@/components/games/rocket/rocketQueue';

const pending = new Map();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export default function rocketRequests(payload) {
  const action = payload.action || 'state';
  const key = JSON.stringify(payload);
  if (pending.has(key)) return pending.get(key);
  const run = async () => {
    // Refreshes do not retry: the next scheduled refresh reconciles state.
    const retries = ['cashout', 'setAutoValue', 'ledger'].includes(action) ? 2 : 0;
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await enqueueRocketRequest(action, async () => {
          try {
            const response = await base44.functions.invoke('rocket-game', payload);
            return response.data;
          } catch (error) {
            if (error?.response?.status === 429) {
              const seconds = Number(error.response.headers?.['retry-after']);
              deferRocketRequests(Number.isFinite(seconds) && seconds > 0
                ? Math.min(120000, seconds * 1000) : 15000 + Math.random() * 3000);
            }
            throw error;
          }
        });
      } catch (error) {
        const status = error?.response?.status;
        if ((error.response && status !== 429 && status < 500) || attempt >= retries) throw error;
        // Release the queue while waiting so polling cannot hold up a cashout.
        if (status !== 429) await pause((attempt + 1) * 800 + Math.random() * 400);
      }
    }
  };
  const result = run().finally(() => pending.delete(key));
  pending.set(key, result);
  return result;
}