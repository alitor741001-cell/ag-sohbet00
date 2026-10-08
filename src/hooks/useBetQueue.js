import { useCallback, useRef } from 'react';

/**
 * Bahis kaydını sıraya alır: istekler tek tek gider ve yalnızca en son isteğin
 * yanıtı ekrana yazılır. Böylece hızlı art arda basışta geç dönen eski yanıt
 * (ya da yoğunluk sonrası tekrarlanan eski istek) yeni seçilen bahsi geri düşürmez.
 */
export default function useBetQueue() {
  const queueRef = useRef({ token: 0, chain: Promise.resolve() });

  return useCallback((send, apply) => {
    const queue = queueRef.current;
    const token = (queue.token += 1);
    queue.chain = queue.chain.then(async () => {
      try {
        const response = await send();
        // Yalnızca en son isteğin yanıtı ekrana yazılır: eskisi yenisini ezemez.
        if (token === queue.token) apply(response?.data);
      } catch (error) {
        // Bahis anlık olarak korunur.
      }
    });
  }, []);
}