import { useCallback, useLayoutEffect, useRef } from 'react';

/** Follow new content only while the reader is already near the bottom. */
export default function useFollowMessages(ref, messages, threadId) {
  const pinned = useRef(true);
  const followLatest = useCallback(() => {
    pinned.current = true;
    const node = ref.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [ref]);
  const onScroll = useCallback(() => {
    const node = ref.current;
    if (node) pinned.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
  }, [ref]);
  const onContentLoad = useCallback(() => {
    const node = ref.current;
    if (node && pinned.current) node.scrollTop = node.scrollHeight;
  }, [ref]);
  useLayoutEffect(() => { pinned.current = true; }, [threadId]);
  useLayoutEffect(onContentLoad, [messages, onContentLoad]);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(onContentLoad);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, onContentLoad, messages.length > 0]);
  return { onScroll, onContentLoad, followLatest };
}