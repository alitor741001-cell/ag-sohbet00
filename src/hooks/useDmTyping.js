import { useCallback, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export default function useDmTyping(conversationId, userId, name, active = true) {
  const current = useRef(null);
  useEffect(() => {
    if (!conversationId || !userId || !active) return;
    const state = { id: null, timer: 0, pending: false, last: 0, closed: false, revision: 0 };
    current.current = state;
    return () => {
      state.closed = true;
      clearTimeout(state.timer);
      if (state.id) base44.entities.DmTyping.delete(state.id).catch(() => {});
      if (current.current === state) current.current = null;
    };
  }, [conversationId, userId, active]);
  const stopTyping = useCallback(() => {
    const state = current.current;
    if (!state) return;
    clearTimeout(state.timer);
    const id = state.id;
    state.id = null;
    state.last = 0;
    state.revision++;
    if (id) base44.entities.DmTyping.delete(id).catch(() => {});
  }, []);
  const signalTyping = useCallback(() => {
    const state = current.current;
    if (!state) return;
    clearTimeout(state.timer);
    state.timer = setTimeout(stopTyping, 3000);
    if (state.pending || Date.now() - state.last < 2000) return;
    state.pending = true;
    state.last = Date.now();
    const data = { conversation_id: conversationId, user_id: userId, user_name: name || 'Kullanıcı', updated_at: new Date().toISOString() };
    const revision = state.revision;
    const request = state.id ? base44.entities.DmTyping.update(state.id, { updated_at: data.updated_at }) : base44.entities.DmTyping.create(data);
    request.then(record => {
      if (state.closed || state.revision !== revision) { if (record?.id) base44.entities.DmTyping.delete(record.id).catch(() => {}); }
      else state.id = record?.id || state.id;
    }).catch(() => {}).finally(() => { state.pending = false; });
  }, [conversationId, userId, name, stopTyping]);
  return { signalTyping, stopTyping };
}