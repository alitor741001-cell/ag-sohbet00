import { useCallback, useEffect, useRef, useState } from 'react';
import mafyaRequests from '@/components/games/mafya/mafyaRequests';

const LOBBY_POLL_MS = 5000;
const ROOM_POLL_MS = 2000;

const EMPTY = {
  status: 'loading',
  rooms: [],
  myRoomId: '',
  room: null,
  me: null,
  chat: [],
  error: '',
};

/** Aşamanın bitişine kalan saniye: sunucudan gelen bitiş zamanı yerel saatle sayılır. */
export function useMafyaCountdown(endsAt) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const calc = () => {
      const end = endsAt ? Date.parse(endsAt) : 0;
      setLeft(end ? Math.max(0, Math.ceil((end - Date.now()) / 1000)) : 0);
    };
    calc();
    const timer = setInterval(calc, 500);
    return () => clearInterval(timer);
  }, [endsAt]);
  return left;
}

/** ÇEYREK MAFYA durumu: odadayken oyun, lobide açık odalar sunucudan yoklanır.
    Roller ve gece notları yalnızca oyuncunun kendisine gelir. */
export default function useMafyaGame() {
  const [state, setState] = useState(EMPTY);
  const roomIdRef = useRef('');

  const applyState = useCallback((data) => {
    if (!data || data.gone) {
      setState((prev) => ({ ...prev, status: 'ready', room: null, me: null, chat: [] }));
      return;
    }
    setState((prev) => ({
      ...prev,
      status: 'ready',
      error: '',
      rooms: data.rooms || prev.rooms,
      myRoomId: data.my_room_id ?? prev.myRoomId,
      room: data.room || prev.room,
      me: data.me || prev.me,
      chat: data.chat || prev.chat,
    }));
  }, []);

  const syncRoom = useCallback(async (roomId) => {
    const data = await mafyaRequests({ action: 'sync', room_id: roomId });
    applyState(data);
  }, [applyState]);

  const act = useCallback(async (payload) => {
    setState((prev) => ({ ...prev, error: '' }));
    try {
      const data = await mafyaRequests(payload);
      if (data?.left) {
        setState((prev) => ({ ...prev, room: null, me: null, chat: [] }));
      } else if (data?.room) {
        applyState(data);
      } else if (data?.room_id) {
        await syncRoom(data.room_id);
      }
      return data;
    } catch (error) {
      setState((prev) => ({ ...prev, error: error?.response?.data?.error || 'İşlem tamamlanamadı.' }));
      return null;
    }
  }, [applyState, syncRoom]);

  const roomId = state.room?.id || '';
  roomIdRef.current = roomId;

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const data = roomIdRef.current
          ? await mafyaRequests({ action: 'sync', room_id: roomIdRef.current })
          : await mafyaRequests({ action: 'lobby' });
        if (!stop) applyState(data);
      } catch (error) {
        if (!stop && !roomIdRef.current) {
          setState((prev) => ({
            ...prev,
            status: 'ready',
            error: error?.response?.data?.error || 'Bağlantı kurulamadı.',
          }));
        }
      }
    };
    tick();
    const timer = setInterval(tick, roomId ? ROOM_POLL_MS : LOBBY_POLL_MS);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [roomId, applyState]);

  const clearError = useCallback(() => setState((prev) => ({ ...prev, error: '' })), []);

  return { ...state, act, syncRoom, clearError };
}