import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import pkApi from '@/lib/pkApi';
import subscribeEntity from '@/components/data/entitySubscriptions';

// Bekleyen davet bu süreden sonra geçersizdir: karşı tarafa "süresi doldu" olarak gösterilir.
export const PK_INVITE_TTL_MS = 10 * 60 * 1000;

/** Kişinin kendi görüntülü PK lobisinin kimliği (sesli odadan tamamen bağımsız). */
export const videoLobbyId = (userId) => `video-${userId}`;

/**
 * Görüntülü PK oturumu: kişinin kendi lobisi, gelen davetler ve kabul edilmiş maç.
 * Kayıt değiştiğinde herkes aynı durumu görür (realtime + yedek yoklama).
 */
export default function useVideoPk(user) {
  const [lobby, setLobby] = useState(null);
  const [lastHosted, setLastHosted] = useState(null);
  const [joined, setJoined] = useState(null);
  const [lastGuest, setLastGuest] = useState(null);
  const [invites, setInvites] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const lobbyRef = useRef(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [hosted, incoming, guestRows] = await Promise.all([
      base44.entities.PkMatch.filter(
        { host_id: user.id, mode: 'video' },
        { sort: '-created_date', limit: 8 },
      ).catch(() => null),
      base44.entities.PkMatch.filter(
        { guest_id: user.id, accepted: false, status: { $in: ['invite', 'live'] }, mode: 'video' },
        { sort: '-created_date', limit: 8 },
      ).catch(() => null),
      base44.entities.PkMatch.filter(
        { guest_id: user.id, mode: 'video' },
        { sort: '-created_date', limit: 6 },
      ).catch(() => null),
    ]);

    const hostedRows = hosted?.items || [];
    const openLobby = hostedRows.find((row) => row.status !== 'ended') || null;
    const latest = hostedRows[0] || null;
    lobbyRef.current = openLobby;
    setLobby(openLobby);
    // Son lobi kaydı ret bilgisini taşır: davet reddedildiyse kayıt kapalı ve davet edilenle işaretlidir.
    setLastHosted(latest);
    const guestList = guestRows?.items?.filter((row) => row.guest_id === user.id) || [];
    setJoined(guestList.find((row) => row.accepted && row.status === 'live') || null);
    setLastGuest(guestList[0] || null);
    setInvites((incoming?.items || []).filter((row) => row.guest_id === user.id));
    setLoaded(true);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;
    load().catch(() => null);
    const off = subscribeEntity('PkMatch', () => { load().catch(() => null); });
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') load().catch(() => null);
    }, 4000);
    return () => { off?.(); window.clearInterval(timer); };
  }, [user?.id, load]);

  const run = useCallback(async (action, payload = {}) => {
    setBusy(true);
    try {
      const data = await pkApi(action, payload);
      await load();
      return data;
    } finally {
      setBusy(false);
    }
  }, [load]);

  // Sayfaya girildiğinde kişinin kendi tek kameralı lobisi açılır; davet bu lobiye düşer.
  const ensureLobby = useCallback(async () => {
    if (!user?.id) return null;
    if (lobbyRef.current?.status === 'live') return lobbyRef.current;
    const data = await pkApi('broadcast', {
      room_id: videoLobbyId(user.id),
      room_name: user.full_name || 'Görüntülü PK',
      mode: 'video',
    });
    if (data?.match) { lobbyRef.current = data.match; setLobby(data.match); }
    return data?.match || null;
  }, [user?.id, user?.full_name]);

  // Bir davet kabul edildiğinde o maç aktif oturum olur; kendi lobisi kapanır.
  // Tur bittiyse sonuç iki tarafta da aynı kayıttan okunur (sonuç ekranı kaybolmaz).
  const active = joined
    || (lobby && lobby.status !== 'ended' ? lobby : null)
    || (lastHosted && lastHosted.status === 'ended' && lastHosted.settled ? lastHosted : null)
    || (lastGuest && lastGuest.status === 'ended' && lastGuest.settled ? lastGuest : null);
  const pendingInvites = invites;
  const expiredInvite = pendingInvites.find((row) => (
    Date.now() - new Date(row.created_date || 0).getTime() > PK_INVITE_TTL_MS
  )) || null;
  // Davet reddedildi: kayıt ret veren kişiyle kapatılır, davet sahibi bunu görür.
  const declined = lastHosted
    && lastHosted.status === 'ended'
    && !!lastHosted.left_id
    && lastHosted.left_id === lastHosted.guest_id
    && lastHosted.settled !== true
    ? lastHosted
    : null;

  return { lobby, joined, active, invites: pendingInvites, expiredInvite, declined, loaded, busy, run, ensureLobby, refresh: load };
}