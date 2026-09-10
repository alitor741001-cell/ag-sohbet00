import { useLayoutEffect, useState } from 'react';

export default function useChatViewport(embedded, messagesRef) {
  const [style, setStyle] = useState(undefined);
  useLayoutEffect(() => {
    if (embedded) return;
    const viewport = window.visualViewport;
    const mobile = window.matchMedia('(max-width: 639px)');
    let frame;
    let previousHeight;
    const update = () => {
      if (!mobile.matches) { setStyle(undefined); return; }
      const height = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;
      setStyle((current) => current?.['--chat-visible-height'] === `${height}px` && current?.['--chat-visible-top'] === `${top}px`
        ? current : { '--chat-visible-height': `${height}px`, '--chat-visible-top': `${top}px` });
      if (previousHeight !== undefined && Math.abs(previousHeight - height) > 1) {
        messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
      }
      previousHeight = height;
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    mobile.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      mobile.removeEventListener('change', schedule);
    };
  }, [embedded, messagesRef]);
  return embedded ? undefined : style;
}