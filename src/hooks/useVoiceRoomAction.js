import { useCallback, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export default function useVoiceRoomAction(roomId, setRoom, toast) {
  const pending = useRef(new Set());
  const scope = useRef(null);
  useEffect(() => {
    const current = { roomId };
    scope.current = current;
    return () => { if (scope.current === current) scope.current = null; };
  }, [roomId]);
  return useCallback(async (payload) => {
    const key = `${roomId}:${JSON.stringify(payload)}`;
    if (pending.current.has(key)) return false;
    pending.current.add(key);
    const current = scope.current;
    try {
      const response = await base44.functions.invoke('voice-room', { room_id: roomId, ...payload });
      if (!current || scope.current !== current) return false;
      const data = response?.data || {};
      setRoom((previous) => {
        if (!previous) return previous;
        const next = { ...previous };
        if (Array.isArray(data.seats)) {
          next.seats = data.seats;
          next.seat_count = data.seat_count ?? data.seats.length;
        }
        if (typeof data.number_board === 'boolean') next.number_board = data.number_board;
        if (Array.isArray(data.number_scores)) next.number_scores = data.number_scores;
        if (typeof data.number_board_reset_seat === 'boolean') next.number_board_reset_seat = data.number_board_reset_seat;
        if (typeof data.number_board_reset_room === 'boolean') next.number_board_reset_room = data.number_board_reset_room;
        if (typeof data.board_started_at === 'string') next.board_started_at = data.board_started_at;
        if (typeof data.chat_seated_only === 'boolean') next.chat_seated_only = data.chat_seated_only;
        return next;
      });
      return true;
    } catch (error) {
      if (scope.current === current) toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
      return false;
    } finally { pending.current.delete(key); }
  }, [roomId, setRoom, toast]);
}