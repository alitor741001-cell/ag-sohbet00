import { useLayoutEffect, useRef } from 'react';

import acquirePageScrollLock from '@/lib/pageScrollLock';

/** Geometry comes directly from the visible viewport, not a translated full-height page. */
export default function useChatViewport(ref, onKeyboardChange, enabled = true) {
  const callback = useRef(onKeyboardChange);
  callback.current = onKeyboardChange;
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    const unlock = acquirePageScrollLock();
    const viewport = window.visualViewport;
    const getHeight = () => Math.round(viewport?.height || document.documentElement.clientHeight);
    let baseline = getHeight(), width = window.innerWidth, frame = 0, last = '', open = false;
    const measure = () => {
      frame = 0;
      const height = getHeight();
      if (width !== window.innerWidth) { width = window.innerWidth; baseline = height; }
      baseline = Math.max(baseline, height);
      const keyboard = Math.max(0, baseline - height);
      const focused = document.activeElement;
      const typing = focused?.matches('input:not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]');
      const nextOpen = !!typing && keyboard > 100;
      const offset = Math.max(0, Math.round(viewport?.offsetTop || 0));
      const signature = `${height}:${offset}:${nextOpen}`;
      if (signature !== last) {
        last = signature;
        node.style.setProperty('--visual-viewport-height', `${height}px`);
        node.style.setProperty('--voice-controls-height', `${Math.max(baseline, window.innerHeight)}px`);
        node.style.setProperty('--viewport-offset', `${offset}px`);
        node.style.setProperty('--keyboard-height', `${nextOpen ? keyboard : 0}px`);
        node.dataset.keyboard = nextOpen ? 'open' : 'closed';
      }
      if (open !== nextOpen) { open = nextOpen; callback.current?.(open); }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
      unlock();
    };
  }, [ref, enabled]);
}