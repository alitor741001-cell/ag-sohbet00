import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { mergeMessages, sortMessages } from '@/lib/realtimeMessages';

/** Bounded history pages, sharing the existing realtime message collection. */
export default function useChatHistory(conversationId, userId, setMessages, seenRef) {
  const key = `${userId || ''}:${conversationId || ''}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const pending = useRef(null);
  const paging = useRef({ cursor: null, expanded: false });
  const failedOlder = useRef(false);
  const [status, setStatus] = useState({ loading: true, loadingOlder: false, hasOlder: false, historyError: '' });

  const fetchPage = useCallback(async (older = false, beforePrepend) => {
    if (!conversationId || !userId || pending.current?.key === key) return;
    if (older && !paging.current.cursor) return;
    const request = { key };
    pending.current = request;
    setStatus(previous => ({ ...previous, loadingOlder: older, historyError: '' }));
    try {
      const response = await base44.functions.invoke('dm-service', {
        action: 'history', conversation_id: conversationId, paged: true,
        ...(older ? { cursor: paging.current.cursor } : {}),
      });
      if (currentKey.current !== key || pending.current !== request) return;
      const page = response.data;
      const items = sortMessages(page.messages || []);
      const overlaps = !items.length || seenRef.current.has(items[0].id);
      if (older && items.some(message => !seenRef.current.has(message.id))) beforePrepend?.();
      const advance = older || !paging.current.expanded || !overlaps;
      if (advance) paging.current = { cursor: page.next_cursor, expanded: older };
      items.forEach(message => seenRef.current.add(message.id));
      setMessages(previous => {
        const kept = previous.filter(message => !message.id?.startsWith('temp-') ||
          !items.some(real => real.sender_id === message.sender_id && real.content === message.content));
        return mergeMessages(kept, items).filter(message => !(message.deleted_for || []).includes(userId));
      });
      setStatus(previous => ({ loading: false, loadingOlder: false,
        hasOlder: advance ? Boolean(page.has_more && page.next_cursor) : previous.hasOlder, historyError: '' }));
    } catch (error) {
      if (currentKey.current !== key || pending.current !== request) return;
      failedOlder.current = older;
      setStatus(previous => ({ ...previous, loading: false, loadingOlder: false,
        historyError: error.response?.data?.error || 'Mesajlar yüklenemedi. Tekrar deneyin.' }));
    } finally {
      if (pending.current === request) pending.current = null;
    }
  }, [conversationId, userId, key, setMessages, seenRef]);

  const resetPages = useCallback(() => {
    pending.current = null;
    paging.current = { cursor: null, expanded: false };
    setStatus({ loading: false, loadingOlder: false, hasOlder: false, historyError: '' });
  }, []);
  useEffect(() => {
    pending.current = null;
    paging.current = { cursor: null, expanded: false };
    seenRef.current = new Set();
    setMessages([]);
    setStatus({ loading: Boolean(conversationId && userId), loadingOlder: false, hasOlder: false, historyError: '' });
    fetchPage();
    return () => { pending.current = null; };
  }, [fetchPage, conversationId, userId, setMessages, seenRef]);

  const load = useCallback(() => fetchPage(false), [fetchPage]);
  const loadOlder = useCallback(beforePrepend => fetchPage(true, beforePrepend), [fetchPage]);
  const retryHistory = useCallback(beforePrepend => fetchPage(failedOlder.current, beforePrepend), [fetchPage]);
  return { ...status, load, loadOlder, retryHistory, resetPages };
}