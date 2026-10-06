import { useCallback, useLayoutEffect, useRef } from 'react';

// Stable identity without freezing the current room, selection or permissions.
export default function useLatestCallback(callback) {
  const ref = useRef(callback);
  useLayoutEffect(() => { ref.current = callback; });
  return useCallback((...args) => ref.current(...args), []);
}