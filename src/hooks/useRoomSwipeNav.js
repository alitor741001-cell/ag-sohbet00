import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'voiceRoomSwipeEnabled';

/** Kaydırma tercihi cihazda saklanır: oda değişse de seçim korunur. Varsayılan açık. */
function readEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '0';
  } catch {
    return true;
  }
}

/**
 * Sesli odalar arasında yukarı/aşağı kaydırma: parmak yukarı → daha eski yayın,
 * parmak aşağı → daha yeni yayın. Sıra ana sayfadaki canlı oda listesiyle aynıdır.
 */
export default function useRoomSwipeNav({ roomId, userId, active, navigate }) {
  const [swipeEnabled, setSwipeEnabled] = useState(readEnabled);
  const roomsRef = useRef([]);

  const toggleSwipe = useCallback((value) => {
    setSwipeEnabled(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      // Tercih yazılamazsa seçim yalnızca bu oturumda geçerli olur.
    }
  }, []);

  // Kaydırma açıkken canlı sesli odalar çekilir; kaydırma kapalıyken liste tutulmaz.
  useEffect(() => {
    if (!swipeEnabled || !active) return undefined;
    let alive = true;
    base44.entities.Room.filter({ status: 'active' }, '-created_date', 100)
      .then((list) => {
        if (!alive) return;
        roomsRef.current = list.filter(
          (room) =>
            room.hidden !== true &&
            (room.room_type === 'voice' || room.voice_mode === true) &&
            // Kendi yayını listede yer almaz: gezerken kişinin kendi odası karşısına çıkmaz.
            (!userId || room.owner_id !== userId)
        );
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [swipeEnabled, active, roomId, userId]);

  // Yön: +1 daha eski yayın, -1 daha yeni yayın.
  const step = useCallback((direction) => {
    const list = roomsRef.current;
    const index = list.findIndex((room) => room.id === roomId);
    // Kişi kendi odasındayken (kendi yayını listede yok) gezinti listenin ucundan başlar.
    if (index < 0) {
      const edge = direction > 0 ? list[0] : list[list.length - 1];
      if (edge) navigate(`/sesli-oda/${edge.id}`);
      return;
    }
    const target = list[index + direction];
    if (!target) return;
    navigate(`/sesli-oda/${target.id}`);
  }, [roomId, navigate]);

  return {
    swipeEnabled,
    toggleSwipe,
    goNext: useCallback(() => step(1), [step]),
    goPrevious: useCallback(() => step(-1), [step]),
  };
}