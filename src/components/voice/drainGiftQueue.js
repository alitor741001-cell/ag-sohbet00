const pause = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Seri basışları en fazla 10'luk paketlerle işler; kuyruk toplamına sınır koymaz. */
export default async function drainGiftQueue(queueRef, busyRef, send, onFailure) {
  if (busyRef.current) return;
  busyRef.current = true;
  try {
    await pause(60);
    while (queueRef.current.length) {
      const first = queueRef.current[0];
      let quantity = 1;
      while (quantity < 10 && quantity < queueRef.current.length) {
        const next = queueRef.current[quantity];
        if (next.session !== first.session || next.gift.id !== first.gift.id || next.ids.join('|') !== first.ids.join('|')) break;
        quantity += 1;
      }
      try {
        await send(first.gift, first.ids, quantity);
        queueRef.current.splice(0, quantity);
      } catch (error) {
        // 429: istek kabul edilmedi; basışları silmeden bekleyip devam et.
        if (error?.response?.status === 429) {
          const retry = Number(error.response.headers?.['retry-after']);
          await pause(Math.min(60000, Math.max(1000, retry * 1000 || error.response.data?.retry_after_ms || 2000)));
          continue;
        }
        queueRef.current.splice(0, quantity);
        onFailure(error, first, quantity);
      }
    }
  } finally {
    busyRef.current = false;
  }
}