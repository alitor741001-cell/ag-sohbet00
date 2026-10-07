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

const isVoiceRoom = (room) => room?.room_type === 'voice' || room?.voice_mode === true;

/** Oda türüne göre doğru ekran: sesli oda koltuklu sahne, film odası izleme ekranı. */
const routeFor = (room) => (isVoiceRoom(room) ? `/sesli-oda/${room.id}` : `/oda/${room.id}`);

/** Kabul edilmiş arkadaşların kimlikleri: gezinirken arkadaş yayınları da listeye girer. */
async function loadFriendIds(userId) {
  const ids = new Set();
  if (!userId) return ids;
  const relations = await base44.entities.Friendship
    .filter({ members: userId, status: 'accepted' }, '-updated_date', 200)
    .catch(() => []);
  relations.forEach((relation) => {
    const friendId = relation.requester_id === userId ? relation.recipient_id : relation.requester_id;
    if (friendId && friendId !== userId) ids.add(friendId);
  });
  return ids;
}

/**
 * Canlı yayınlar arasında yukarı/aşağı kaydırma: parmak yukarı → daha eski yayın,
 * parmak aşağı → daha yeni yayın. Sıra ana sayfadaki canlı oda listesiyle aynıdır;
 * sesli odaların yanında arkadaşların film odaları da gezinir.
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

  // Kaydırma açıkken canlı yayınlar çekilir; kaydırma kapalıyken liste tutulmaz.
  useEffect(() => {
    if (!swipeEnabled || !active) return undefined;
    let alive = true;
    const load = async () => {
      const [list, friendIds] = await Promise.all([
        base44.entities.Room.filter({ status: 'active' }, '-created_date', 100).catch(() => []),
        loadFriendIds(userId),
      ]);
      if (!alive) return;
      // Gezinirken yalnızca girilebilen canlı yayınlar karşımıza çıkar: kapalı (içinde kimse
      // olmayan kilitli), şifreli, gizli, dolu ve giriş yasağı olan odalar listeye girmez.
      roomsRef.current = list.filter((room) => {
        const inside = room.participants || [];
        return room.status === 'active'
          && room.hidden !== true
          // Kendi yayını listede yer almaz: gezerken kişinin kendi odası karşısına çıkmaz.
          && (!userId || room.owner_id !== userId)
          // İçinde kimse olmayan oda kilitlidir: gezinirken girilmez.
          && inside.length > 0
          // Şifreli oda şifre sorar: kaydırırken kendiliğinden açılmaz.
          && !room.password
          // Odadan atılan kişi yasağı bitene kadar o yayında karşımıza çıkmaz.
          && !(room.banned_users || []).some((ban) => ban.user_id === userId
            && (!ban.banned_until || new Date(ban.banned_until).getTime() > Date.now()))
          // Dolu odaya girilemez.
          && inside.length < (room.max_users || 10)
          // Sesli odalar herkes için gezinir; arkadaşların yayınları türüne bakılmadan eklenir.
          && (isVoiceRoom(room) || friendIds.has(room.owner_id));
      });
    };
    load().catch(() => {});
    return () => { alive = false; };
  }, [swipeEnabled, active, roomId, userId]);

  // Yön: +1 daha eski yayın, -1 daha yeni yayın.
  const step = useCallback((direction) => {
    const list = roomsRef.current;
    const index = list.findIndex((room) => room.id === roomId);
    // Kişi kendi odasındayken (kendi yayını listede yok) gezinti listenin ucundan başlar.
    if (index < 0) {
      const edge = direction > 0 ? list[0] : list[list.length - 1];
      if (edge) navigate(routeFor(edge));
      return;
    }
    const target = list[index + direction];
    if (!target) return;
    navigate(routeFor(target));
  }, [roomId, navigate]);

  return {
    swipeEnabled,
    toggleSwipe,
    goNext: useCallback(() => step(1), [step]),
    goPrevious: useCallback(() => step(-1), [step]),
  };
}