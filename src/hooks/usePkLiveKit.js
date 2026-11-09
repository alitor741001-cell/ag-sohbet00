import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { base44 } from '@/api/base44Client';

/**
 * Görüntülü PK bağlantısı: her PK oturumu için ayrı bir LiveKit odası açılır.
 * Sesli oda bağlantısıyla hiçbir bağı yoktur — yalnızca bu maçın iki tarafı bağlanır.
 * Davet kabul edilene kadar bağlantı kurulmaz (enabled=false): karşı tarafın kamerası açılmaz.
 */
export default function usePkLiveKit({ matchId, enabled, selfId }) {
  const [room, setRoom] = useState(null);
  const [localTrack, setLocalTrack] = useState(null);
  const [remoteTracks, setRemoteTracks] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const roomRef = useRef(null);

  const scanRemote = useCallback((instance) => {
    if (!instance) return;
    const list = [];
    instance.remoteParticipants?.forEach((participant, identity) => {
      if (!identity || identity === selfId) return;
      participant.trackPublications?.forEach((publication) => {
        if (publication.kind !== Track.Kind.Video) return;
        if (!publication.isSubscribed) {
          try { publication.setSubscribed?.(true); } catch (subscribeError) { /* yayın hazır değil */ }
          return;
        }
        if (!publication.track) return;
        list.push({ identity, track: publication.track });
      });
    });
    setRemoteTracks(list);
  }, [selfId]);

  // Bağlantı: maç ve kabul varsa kurulur, sayfadan çıkıldığında tamamen kapatılır.
  useEffect(() => {
    if (!enabled || !matchId || !selfId) {
      setStatus('idle');
      setLocalTrack(null);
      setRemoteTracks([]);
      return undefined;
    }

    let cancelled = false;
    const instance = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = instance;
    setStatus('connecting');
    setError('');

    const events = [
      RoomEvent.TrackSubscribed, RoomEvent.TrackUnsubscribed,
      RoomEvent.TrackPublished, RoomEvent.TrackUnpublished,
      RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected,
      RoomEvent.Disconnected,
    ];
    const onTracks = () => scanRemote(instance);
    const onDisconnected = () => { if (!cancelled) { setStatus('disconnected'); setRemoteTracks([]); } };
    events.forEach((event) => {
      instance.on(event, event === RoomEvent.Disconnected ? onDisconnected : onTracks);
    });

    (async () => {
      try {
        const response = await base44.functions.invoke('livekit-token', { pk_match_id: matchId });
        const { token, url } = response?.data || {};
        if (!token || !url) throw new Error('Bağlantı anahtarı alınamadı');
        await instance.connect(url, token, { autoSubscribe: true });
        if (cancelled) { instance.disconnect(); return; }
        setRoom(instance);
        setStatus('connected');
        // Ses, dokunmayla açılan sayfada serbest bırakılır; engellenirse sessizce beklenir.
        instance.startAudio?.().catch(() => {});

        // Kamera: tek katman H.264, karşı taraf görüntüyü her cihazda görür.
        try {
          await instance.localParticipant.setCameraEnabled(
            true,
            { resolution: { width: 720, height: 1280, frameRate: 24 }, facingMode: 'user' },
            { simulcast: false, videoCodec: 'h264' },
          );
        } catch (highError) {
          await instance.localParticipant.setCameraEnabled(
            true,
            { resolution: { width: 480, height: 640, frameRate: 15 }, facingMode: 'user' },
            { simulcast: false },
          ).catch(() => null);
        }
        if (cancelled) return;
        const publication = instance.localParticipant.getTrackPublication?.(Track.Source.Camera);
        setLocalTrack(publication?.videoTrack || publication?.track || null);
        setCamOn(true);
        await instance.localParticipant.setMicrophoneEnabled(true).catch(() => null);
        setMicOn(true);
        scanRemote(instance);
      } catch (connectError) {
        if (cancelled) return;
        setStatus('error');
        setError(connectError?.message || 'PK bağlantısı kurulamadı');
      }
    })();

    return () => {
      cancelled = true;
      events.forEach((event) => instance.off?.(event, event === RoomEvent.Disconnected ? onDisconnected : onTracks));
      try { instance.disconnect(); } catch (disconnectError) { /* bağlantı zaten kapalı */ }
      roomRef.current = null;
      setRoom(null);
      setLocalTrack(null);
      setRemoteTracks([]);
      setStatus('idle');
    };
  }, [matchId, enabled, selfId, scanRemote]);

  // Kamera aç/kapat: yayın susturulur, karşı taraf kapalı olduğunu görür.
  const setCameraEnabled = useCallback((next) => {
    setCamOn(next);
    const local = roomRef.current?.localParticipant;
    try {
      const publication = local?.getTrackPublication?.(Track.Source.Camera);
      const track = publication?.videoTrack || publication?.track;
      if (next) track?.unmute?.(); else track?.mute?.();
    } catch (cameraError) { /* yayın hazır değil */ }
  }, []);

  // Mikrofon: PK sırasında yalnızca bu odadaki iki kişinin sesi duyulur.
  const setMicEnabled = useCallback((next) => {
    setMicOn(next);
    roomRef.current?.localParticipant?.setMicrophoneEnabled?.(next).catch(() => {});
  }, []);

  const startAudio = useCallback(() => {
    roomRef.current?.startAudio?.().catch(() => {});
  }, []);

  return { room, localTrack, remoteTracks, status, error, camOn, setCameraEnabled, micOn, setMicEnabled, startAudio };
}