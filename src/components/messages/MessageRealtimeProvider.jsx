import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

const MessageRealtimeContext = createContext(null);
const sortConversations = (items) => [...items].sort((a, b) => new Date(b.last_message_at || b.updated_date || 0) - new Date(a.last_message_at || a.updated_date || 0));

export function useMessageRealtime() {
  const value = useContext(MessageRealtimeContext);
  if (!value) throw new Error('MessageRealtimeProvider gerekli');
  return value;
}

export default function MessageRealtimeProvider({ userId, children }) {
  const [conversations, setConversations] = useState([]);
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const openThread = useRef(null);
  const [typingMap, setTypingMap] = useState({});
  const conversationsRef = useRef(conversations);
  const pendingFriends = useRef(new Map());
  const loadRef = useRef(null);
  const currentUserId = useRef(userId);
  currentUserId.current = userId;
  conversationsRef.current = conversations;
  const reload = useCallback(async () => {
    if (!userId) return;
    if (loadRef.current?.userId === userId) return loadRef.current.promise;
    const promise = (async () => {
    try {
      const [items, pending] = await Promise.all([base44.entities.Conversation.filter({ members: userId }, '-updated_date', 200), base44.entities.Friendship.filter({ recipient_id: userId, status: 'pending' }, '-created_date', 100)]);
      if (currentUserId.current !== userId) return;
      pendingFriends.current = new Map(pending.map((item) => [item.id, item]));
      setConversations(sortConversations((items || []).filter((item) => !(item.deleted_for || []).includes(userId))));
      setRequests(pending.length);
    } catch {
      // Yoğunluk ya da ağ hatasında mevcut liste korunur: yedek yoklama hatası ekrana düşmez.
    } finally {
      if (currentUserId.current === userId) setLoading(false);
    }
    })();
    loadRef.current = { userId, promise };
    await promise;
    if (loadRef.current?.promise === promise) loadRef.current = null;
  }, [userId]);
  useEffect(() => {
    if (!userId) { setConversations([]); setRequests(0); setLoading(false); return; }
    let alive = true;
    const timers = new Set();
    const reads = new Map();
    const lookups = new Set();
    const seenMessages = new Set();
    const later = (callback, delay) => {
      const timer = setTimeout(() => { timers.delete(timer); if (alive) callback(); }, delay);
      timers.add(timer); return timer;
    };
    setConversations([]); setTypingMap({}); pendingFriends.current.clear(); openThread.current = null;
    setLoading(true); reload();
    const offConversations = subscribeEntity('Conversation', (event) => {
      const id = event.data?.id || event.id;
      setConversations((current) => {
        if (event.type === 'delete') return current.filter((item) => item.id !== id);
        const existing = current.find((item) => item.id === id);
        if (!existing && !(event.data?.members || []).includes(userId)) return current;
        const merged = { ...(existing || {}), ...(event.data || {}), id };
        if (openThread.current === id) {
          if (merged.user1_id === userId) merged.unread_user1 = 0;
          else merged.unread_user2 = 0;
        }
        if ((merged.deleted_for || []).includes(userId)) return current.filter((item) => item.id !== id);
        return sortConversations([merged, ...current.filter((item) => item.id !== id)]);
      });
    });
    const offMessages = subscribeEntity('ChatMessage', (event) => {
      const message = event.data;
      if (!message || (message.sender_id !== userId && message.receiver_id !== userId)) return;
      window.dispatchEvent(new CustomEvent('filmkeyfi-message-realtime', { detail: event }));
      if (event.type !== 'create' || seenMessages.has(message.id)) return;
      seenMessages.add(message.id);
      if (seenMessages.size > 1000) seenMessages.delete(seenMessages.values().next().value);
      if (!conversationsRef.current.some((item) => item.id === message.conversation_id) && !lookups.has(message.conversation_id)) {
        lookups.add(message.conversation_id);
        later(() => base44.entities.Conversation.get(message.conversation_id).then((item) => {
          if (!alive || currentUserId.current !== userId) return;
          setConversations((current) => current.some((entry) => entry.id === item.id) ? current : sortConversations([{ ...item, deleted_for: (item.deleted_for || []).filter((id) => id !== userId), last_message_text: message.content || '[Görsel]', last_message_at: message.created_date }, ...current]));
        }).catch(() => {}).finally(() => lookups.delete(message.conversation_id)), 200);
      }
      setConversations((current) => sortConversations(current.map((item) => item.id !== message.conversation_id ? item : { ...item, deleted_for: (item.deleted_for || []).filter((id) => id !== userId), last_message_text: message.content || '[Görsel]', last_message_at: message.created_date, last_sender_id: message.sender_id, ...(message.receiver_id === userId && openThread.current !== item.id ? (item.user1_id === userId ? { unread_user1: (item.unread_user1 || 0) + 1 } : { unread_user2: (item.unread_user2 || 0) + 1 }) : {}) })));
      if (message.receiver_id === userId && openThread.current === message.conversation_id && !reads.has(message.conversation_id)) {
        reads.set(message.conversation_id, later(() => {
          reads.delete(message.conversation_id);
          base44.functions.invoke('dm-service', { action: 'mark_read', conversation_id: message.conversation_id }).catch(() => {});
        }, 250));
      }
    });
    const offFriends = subscribeEntity('Friendship', (event) => {
      const id = event.data?.id || event.id;
      const known = pendingFriends.current.get(id);
      if (!known && event.data?.recipient_id !== userId) return;
      const merged = { ...known, ...event.data, id };
      if (event.type === 'delete' || merged.status !== 'pending') pendingFriends.current.delete(id);
      else pendingFriends.current.set(id, merged);
      setRequests(pendingFriends.current.size);
    });
    base44.entities.DmTyping.list('-updated_date', 200).then((records) => {
      if (!alive) return;
      const now = Date.now();
      const map = {};
      (records || []).forEach((r) => {
        if (r.conversation_id && now - new Date(r.updated_at || r.created_date).getTime() < 3000) {
          map[r.conversation_id] = { user_id: r.user_id, user_name: r.user_name, updated_at: r.updated_at || r.created_date };
        }
      });
      setTypingMap(map);
    }).catch(() => {});
    const offDmTyping = subscribeEntity('DmTyping', (event) => {
      const data = event.data;
      if (!data?.conversation_id || !conversationsRef.current.some((item) => item.id === data.conversation_id)) return;
      setTypingMap((current) => {
        if (event.type === 'delete') { const next = { ...current }; delete next[data.conversation_id]; return next; }
        return { ...current, [data.conversation_id]: { user_id: data.user_id, user_name: data.user_name, updated_at: data.updated_at } };
      });
    });
    const typingPoll = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setTypingMap((current) => {
        const now = Date.now(); let changed = false; const next = {};
        Object.entries(current).forEach(([cid, info]) => { if (now - new Date(info.updated_at || 0).getTime() < 3000) next[cid] = info; else changed = true; });
        return changed ? next : current;
      });
    }, 1000);
    const opened = (event) => { openThread.current = event.detail?.conversationId || null; setConversations((current) => current.map((item) => item.id !== openThread.current ? item : { ...item, ...(item.user1_id === userId ? { unread_user1: 0 } : { unread_user2: 0 }) })); };
    const closed = () => { openThread.current = null; };
    const reconnect = () => reload(); const visible = () => { if (document.visibilityState === 'visible') reload(); };
    // Sohbet listesi ve rozetler 5 saniyede bir sessizce tazelenir.
    const refreshPoll = window.setInterval(() => { if (document.visibilityState !== 'hidden') reload(); }, 5000);
    window.addEventListener('social-thread-open', opened); window.addEventListener('social-thread-close', closed); window.addEventListener('online', reconnect); document.addEventListener('visibilitychange', visible);
    return () => { alive = false; timers.forEach(clearTimeout); timers.clear(); offConversations(); offMessages(); offFriends(); offDmTyping(); clearInterval(typingPoll); clearInterval(refreshPoll); window.removeEventListener('social-thread-open', opened); window.removeEventListener('social-thread-close', closed); window.removeEventListener('online', reconnect); document.removeEventListener('visibilitychange', visible); };
  }, [userId, reload]);
  const badges = useMemo(() => ({ requests, messages: conversations.reduce((sum, item) => sum + (item.user1_id === userId ? item.unread_user1 || 0 : item.unread_user2 || 0), 0) }), [requests, conversations, userId]);
  const optimisticHide = useCallback((id) => setConversations((items) => items.filter((item) => item.id !== id)), []);
  const optimisticPatch = useCallback((id, patch) => setConversations((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item)), []);
  const isTyping = useCallback((conversationId, otherId) => { const info = typingMap[conversationId]; return !!info && info.user_id === otherId; }, [typingMap]);
  const value = useMemo(() => ({ conversations, loading, reload, optimisticHide, optimisticPatch, badges, typingMap, isTyping }), [conversations, loading, reload, optimisticHide, optimisticPatch, badges, typingMap, isTyping]);
  return <MessageRealtimeContext.Provider value={value}>{children}</MessageRealtimeContext.Provider>;
}