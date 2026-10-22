import { useLayoutEffect } from 'react';
import acquirePageScrollLock from '@/lib/pageScrollLock';

export default function usePageScrollLock(enabled = true) {
  useLayoutEffect(() => {
    if (enabled) return acquirePageScrollLock();
  }, [enabled]);
}