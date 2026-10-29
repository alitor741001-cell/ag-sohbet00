import { useLayoutEffect, useRef } from 'react';
import acquirePageScrollLock from '@/lib/pageScrollLock';

/** Freeze room geometry; only the composer tracks the keyboard. */
export default function useVoiceRoomViewport(ref, onKeyboardChange) {
  const callback = useRef(onKeyboardChange);
  callback.current = onKeyboardChange;
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const unlock = acquirePageScrollLock(), viewport = window.visualViewport;
    let width = window.innerWidth, height = Math.round(viewport?.height || window.innerHeight), frame = 0, open = false;
    const measure = () => {
      frame = 0;
      const visible = Math.round(viewport?.height || window.innerHeight);
      const typing = document.activeElement?.matches('input,textarea,[contenteditable="true"]');
      if (width !== window.innerWidth || !typing) { width = window.innerWidth; height = visible; }
      const keyboard = typing ? Math.max(0, height - visible - (viewport?.offsetTop || 0)) : 0;
      const next = keyboard > 100;
      node.style.setProperty('--visual-viewport-height', `${height}px`);
      node.style.setProperty('--voice-visible-height', `${visible}px`);
      node.style.setProperty('--viewport-offset', '0px');
      node.style.setProperty('--keyboard-height', `${next ? keyboard : 0}px`);
      node.style.width = `${width}px`;
      node.dataset.keyboard = next ? 'open' : 'closed';
      if (next !== open) { open = next; callback.current?.(next); }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    return () => {
      cancelAnimationFrame(frame); unlock();
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
    };
  }, [ref]);
}