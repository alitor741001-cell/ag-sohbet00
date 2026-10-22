import { useCallback, useLayoutEffect, useRef } from 'react';

/** Follow new content only while the reader is already near the bottom. */
export default function useFollowMessages(ref, messages, threadId) {
  const pinned = useRef(true);
  const anchor = useRef(null);
  const preservePosition = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    pinned.current = false;
    const top = node.getBoundingClientRect().top;
    const item = [...node.querySelectorAll('[data-message-id]')].find(element => element.getBoundingClientRect().bottom > top);
    anchor.current = item ? { id: item.dataset.messageId, offset: item.getBoundingClientRect().top - top } : null;
  }, [ref]);
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
  useLayoutEffect(() => { pinned.current = true; anchor.current = null; }, [threadId]);
  useLayoutEffect(() => {
    const node = ref.current;
    if (node && anchor.current) {
      const item = [...node.querySelectorAll('[data-message-id]')].find(element => element.dataset.messageId === anchor.current.id);
      if (item) node.scrollTop += item.getBoundingClientRect().top - node.getBoundingClientRect().top - anchor.current.offset;
      anchor.current = null;
      return;
    }
    onContentLoad();
  }, [messages, onContentLoad, ref]);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(onContentLoad);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, onContentLoad, messages.length > 0]);
  return { onScroll, onContentLoad, followLatest, preservePosition };
}