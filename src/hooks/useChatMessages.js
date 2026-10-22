import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { upsertMessage, sortMessages } from '@/lib/realtimeMessages';
import { makeId } from '@/lib/uid';
import useChatHistory from '@/hooks/useChatHistory';

/**
 * Sohbet mesajları hook'u — belirli bir conversationId için mesajları yükler ve realtime dinler.
 *
 * Koruma mekanizmaları:
 * 1. activeIdRef: conversationId değişince eski async sonuçları ignore edilir
 * 2. seenRef: aynı messageId iki kez eklenmez (duplicate önlemi)
 * 3. temp mesaj eşleştirme: optimistic mesaj realtime geldiğinde değiştirilir
 * 4. cleanup: conversationId değişince eski subscription kapatılır
 * 5. deleted_for: kullanıcı bazlı silme — sadece silen kullanıcıdan gizlenir
 * 6. Global listener: sayfa geçişlerinde tek bağlantı üzerinden anlık günceller
 */
export default function useChatMessages(conversationId, active = true) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const userId = user?.id;
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const messagesSnapshot = useRef(messages);
  messagesSnapshot.current = messages;
  const seenRef = useRef(new Set());
  const activeIdRef = useRef(conversationId);
  const sendingRef = useRef(false);
  const readPendingRef = useRef(new Set());
  const visibleRef = useRef(active);
  visibleRef.current = active;

  useEffect(() => {
    activeIdRef.current = conversationId;
  }, [conversationId]);

  const { load, resetPages, ...history } = useChatHistory(conversationId, userId, setMessages, seenRef);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!conversationId) return;
    activeIdRef.current = conversationId;

    const onRealtimeMessage = ({ detail: event }) => {
      if (event.data?.conversation_id !== conversationId) return;
      if (event.type === 'delete') { setMessages((prev) => prev.filter((m) => m.id !== event.id)); return; }
      const msg = event.data;
      if (!msg || !userId) return;
      if ((msg.deleted_for || []).includes(userId)) { setMessages((prev) => prev.filter((m) => m.id !== msg.id)); return; }
      if (seenRef.current.has(msg.id)) { setMessages((prev) => upsertMessage(prev, msg)); return; }
      seenRef.current.add(msg.id);
      setMessages((prev) => {
        const tempMatch = prev.find((m) => m.id?.startsWith('temp-') && m.sender_id === msg.sender_id && m.content === msg.content);
        return upsertMessage(tempMatch ? prev.filter((m) => m.id !== tempMatch.id) : prev, msg);
      });
    };
    window.addEventListener('filmkeyfi-message-realtime', onRealtimeMessage);
    const onVisible = () => { if (visibleRef.current && document.visibilityState === 'visible') loadRef.current(); };
    const onOnline = () => { if (visibleRef.current) loadRef.current(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      if (activeIdRef.current === conversationId) activeIdRef.current = null;
      window.removeEventListener('filmkeyfi-message-realtime', onRealtimeMessage);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [conversationId, userId]);

  const wasActiveRef = useRef(active);
  useEffect(() => {
    if (active && !wasActiveRef.current && conversationId) loadRef.current();
    wasActiveRef.current = active;
  }, [active, conversationId]);

  const send = useCallback(async (content) => {
    if (!conversationId || !userId || !content.trim() || sendingRef.current) return;
    sendingRef.current = true;
    // Geçici mesaj kimliği: eski cihazlarda da çalışan ortak üreticiden alınır.
    const tempId = makeId('temp-');
    const optimistic = {
      id: tempId, conversation_id: conversationId,
      sender_id: userId, sender_name: user?.username || user?.full_name || 'Kullanıcı',
      receiver_id: '', content: content.trim(),
      deleted_for: [], read_by: [userId],
      created_date: new Date().toISOString(),
    };
    setMessages((prev) => sortMessages([...prev, optimistic]));
    try {
      setSending(true);
      const res = await base44.functions.invoke('dm-service', { action: 'send', conversation_id: conversationId, content: content.trim() });
      // Optimistic mesajı gerçek mesajla hemen değiştir — subscription beklemeye gerek yok
      if (activeIdRef.current !== conversationId) return;
      if (res?.data?.message) {
        const realMsg = res.data.message;
        seenRef.current.add(realMsg.id);
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId);
          return upsertMessage(withoutTemp, realMsg);
        });
      }
      if (res?.data?.warning) {
        toast({ description: res.data.warning, duration: 6000 });
      }
    } catch (err) {
      if (activeIdRef.current === conversationId) setMessages((prev) => prev.filter((m) => m.id !== tempId));
      throw err;
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [conversationId, userId, user, toast]);

  const markRead = useCallback(async () => {
    if (!conversationId || !userId || readPendingRef.current.has(conversationId)) return;
    readPendingRef.current.add(conversationId);
    try {
      await base44.functions.invoke('dm-service', { action: 'mark_read', conversation_id: conversationId });
      window.dispatchEvent(new Event('social-badges-refresh'));
    } catch {} finally { readPendingRef.current.delete(conversationId); }
  }, [conversationId, userId]);

  const deleteMessage = useCallback(async (messageId) => {
    if (!messageId) return;
    const removed = messagesSnapshot.current.find(message => message.id === messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    seenRef.current.delete(messageId);
    try {
      await base44.functions.invoke('dm-service', { action: 'delete_message', message_id: messageId });
    } catch (err) {
      if (activeIdRef.current === conversationId && removed) {
        seenRef.current.add(removed.id);
        setMessages(previous => upsertMessage(previous, removed));
      }
      toast({ title: 'Silinemedi', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }
  }, [toast, conversationId]);

  const deleteConversation = useCallback(async () => {
    if (!conversationId || !userId) return;
    try {
      await base44.functions.invoke('dm-service', { action: 'delete_conversation', conversation_id: conversationId });
      setMessages([]);
      seenRef.current = new Set();
      resetPages();
      window.dispatchEvent(new Event('social-badges-refresh'));
    } catch (err) {
      toast({ title: 'Sohbet silinemedi', description: err.response?.data?.error || err.message, variant: 'destructive' });
      throw err;
    }
  }, [conversationId, userId, toast, resetPages]);

  return { messages, ...history, sending, send, markRead, deleteMessage, deleteConversation };
}