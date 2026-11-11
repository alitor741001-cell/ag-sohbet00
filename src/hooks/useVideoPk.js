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
export default function useVideoPk(user, { poll = true } = {}) {
  const [lobby, setLobby] = useState(null);
  const [lastHosted, setLastHosted] = useState(null);
  const [joined, setJoined] = useState(null);
  const [lastGuest, setLastGuest] = useState(null);
  const [invites, setInvites] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const lobbyRef = useRef(null);
  // Kabul edilmiş maç: yeni lobi açılmaz, yoksa maç kapanırdı.
  const joinedRef = useRef(null);

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
    // Turdan kendi ayrılan kişi aynı maça geri bağlanmaz: yeni davet kabul edilince eşleşir.
    const activeJoined = guestList.find((row) => row.accepted && row.status === 'live' && row.left_id !== user.id) || null;
    joinedRef.current = activeJoined;
    setJoined(activeJoined);
    setLastGuest(guestList[0] || null);
    setInvites((incoming?.items || []).filter((row) => row.guest_id === user.id));
    setLoaded(true);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;
    load().catch(() => null);
    const off = subscribeEntity('PkMatch', () => { load().catch(() => null); });
    // Yedek yoklama yalnızca PK alanı açıkken çalışır: odadaki herkesi yormaz.
    const timer = poll
      ? window.setInterval(() => {
        if (document.visibilityState !== 'hidden') load().catch(() => null);
      }, 5000)
      : null;
    return () => { off?.(); if (timer) window.clearInterval(timer); };
  }, [user?.id, load, poll]);

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

  // Görüntülü PK alanı açıldığında kişinin tek kameralı lobisi açılır; davet bu lobiye düşer.
  // Başka odadan kalan bir lobi varsa kapatılır: aynı anda iki oturum açık kalmaz.
  const ensureLobby = useCallback(async (roomId) => {
    if (!user?.id) return null;
    // Kabul edilmiş bir maç varsa yeni lobi açılmaz: maçın kendisi bu ekranda oynanır.
    if (joinedRef.current) return joinedRef.current;
    const current = lobbyRef.current;
    if (current && current.status !== 'ended' && (!roomId || current.room_id === roomId)) return current;
    if (current && current.status !== 'ended' && roomId && current.room_id !== roomId) {
      await pkApi('leave', { id: current.id, end: true }).catch(() => null);
    }
    const data = await pkApi('broadcast', {
      room_id: roomId || videoLobbyId(user.id),
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
  // Süre davetin gönderildiği andan sayılır: yayın kaydının oluşturulma zamanı eski olabilir.
  const expiredInvite = pendingInvites.find((row) => (
    Date.now() - new Date(row.invited_at || row.created_date || 0).getTime() > PK_INVITE_TTL_MS
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