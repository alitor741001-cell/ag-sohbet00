import { useCallback, useEffect, useState } from 'react';
import { RoomEvent, Track } from 'livekit-client';

/**
 * Görüntülü PK kamerası.
 * - Yayın yapan tarafların kamerası LiveKit odasına görüntü olarak yayınlanır.
 * - Sahne açık olduğu sürece karşı tarafların görüntüleri dinlenir: izleyiciler de
 *   iki yayıncıyı görür (yalnızca yayıncılar kamera açar).
 * Ses akışına dokunulmaz: burada yalnızca görüntü yayınlanır.
 */
export default function usePkCamera({ open, publish, livekitRoom, selfId }) {
  const [remoteTracks, setRemoteTracks] = useState([]);
  const [localTrack, setLocalTrack] = useState(null);
  const [error, setError] = useState('');
  const [camOn, setCamOn] = useState(true);

  // Karşı taraf görüntüleri: sahne açık olduğu sürece yeni gelen görüntüler eklenir.
  useEffect(() => {
    if (!open || !livekitRoom) { setRemoteTracks([]); return undefined; }

    const scan = () => {
      const list = [];
      livekitRoom.remoteParticipants?.forEach((participant, identity) => {
        if (!identity || identity === selfId) return;
        participant.trackPublications?.forEach((publication) => {
          if (publication.kind !== Track.Kind.Video) return;
          // Görüntü yayını her cihazda açıkça abone edilir: eski Android ve iOS
          // cihazlarda kendiliğinden abone olmayan yayınlar karşı tarafta siyah kalıyordu.
          if (!publication.isSubscribed) {
            try { publication.setSubscribed?.(true); } catch (subscribeError) { /* yayın hazır değil */ }
            return;
          }
          if (!publication.track) return;
          list.push({ identity, track: publication.track });
        });
      });
      setRemoteTracks(list);
    };

    scan();
    const events = [
      RoomEvent.TrackSubscribed, RoomEvent.TrackUnsubscribed,
      RoomEvent.TrackPublished, RoomEvent.TrackUnpublished,
      RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected,
    ];
    events.forEach((event) => livekitRoom.on(event, scan));
    return () => {
      events.forEach((event) => livekitRoom.off?.(event, scan));
      setRemoteTracks([]);
    };
  }, [open, livekitRoom, selfId]);

  // Kendi kamerası: yalnızca yayıncı taraf açar; izleyici kamera yayınlamaz.
  useEffect(() => {
    const local = livekitRoom?.localParticipant;
    if (!local) return undefined;
    if (!open || !publish) {
      setLocalTrack(null);
      try { local.setCameraEnabled?.(false); } catch (cameraError) { /* yayın zaten kapalı */ }
      return undefined;
    }

    let cancelled = false;
    setError('');
    setCamOn(true);
    (async () => {
      try {
        // Tek katman H.264 yayın: eski iOS ve eski Android cihazlar bu kodeği
        // donanımla çözer, karşı taraf görüntüyü siyah ekran yerine görür.
        let published;
        try {
          published = await local.setCameraEnabled(
            true,
            { resolution: { width: 720, height: 1280, frameRate: 24 }, facingMode: 'user' },
            { simulcast: false, videoCodec: 'h264' },
          );
        } catch (highError) {
          // H.264 ya da yüksek çözünürlük desteklenmiyorsa tarayıcının kendi kodeğiyle,
          // daha küçük kareyle yeniden denenir.
          published = await local.setCameraEnabled(
            true,
            { resolution: { width: 480, height: 640, frameRate: 15 }, facingMode: 'user' },
            { simulcast: false },
          );
        }
        if (cancelled) return;
        const publication = published || local.getTrackPublication?.(Track.Source.Camera);
        const track = publication?.videoTrack || publication?.track || null;
        setLocalTrack(track || null);
        if (!track) setError('Kamera açılamadı. Cihazının kamerasını kontrol et.');
      } catch (cameraError) {
        if (cancelled) return;
        setError(cameraError?.name === 'NotAllowedError' || cameraError?.name === 'SecurityError'
          ? 'Kamera izni verilmedi. İzin verip tekrar dene.'
          : 'Kamera açılamadı. Cihazının kamerasını kontrol et.');
      }
    })();

    return () => {
      cancelled = true;
      setLocalTrack(null);
      try { local.setCameraEnabled?.(false); } catch (cameraError) { /* bağlantı kapanmış olabilir */ }
    };
  }, [open, publish, livekitRoom, selfId]);

  // Kamerayı kapatmak yayını susturur: karşı taraf kameranın kapalı olduğunu görür.
  const setCameraEnabled = useCallback((next) => {
    setCamOn(next);
    try {
      const publication = livekitRoom?.localParticipant?.getTrackPublication?.(Track.Source.Camera);
      const track = publication?.videoTrack || publication?.track;
      if (next) track?.unmute?.();
      else track?.mute?.();
    } catch (cameraError) {
      console.warn('[PK] Kamera durumu değiştirilemedi', cameraError);
    }
  }, [livekitRoom]);

  return { localTrack, remoteTracks, error, camOn, setCameraEnabled };
}