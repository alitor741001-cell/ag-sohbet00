import { useCallback, useEffect, useRef, useState } from 'react';
import { RoomEvent, Track } from 'livekit-client';

/**
 * Görüntülü PK kamerası: kişinin kendi kamerası açılır ve odadaki LiveKit bağlantısına
 * görüntü olarak yayınlanır. Karşı taraf da PK'ya girdiğinde iki kamera karşılıklı görünür.
 * Ses akışına dokunulmaz: burada yalnızca görüntü yayınlanır.
 * Kendi görüntüsü aynalı gösterilir (TikTok gibi); yayına gönderilen görüntü aynalanmaz.
 */
export default function usePkCamera({ active, livekitRoom, selfId }) {
  const localVideoRef = useRef(null);
  const publicationRef = useRef(null);
  const [remoteTracks, setRemoteTracks] = useState([]);
  const [error, setError] = useState('');
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    let stream = null;
    let videoTrack = null;
    let publication = null;
    setRemoteTracks([]);
    setError('');
    setCamOn(true);

    // Karşı tarafların kameraları: gelen görüntü kimliğiyle birlikte tutulur.
    const attach = (track, participant) => {
      if (track?.kind !== Track.Kind.Video) return;
      const identity = participant?.identity || '';
      if (!identity || identity === selfId) return;
      setRemoteTracks((prev) => {
        const rest = prev.filter((item) => item.identity !== identity);
        return [...rest, { identity, name: participant?.name || '', track }];
      });
    };
    const detach = (track, _publication, participant) => {
      if (track?.kind !== Track.Kind.Video) return;
      const identity = participant?.identity || '';
      setRemoteTracks((prev) => prev.filter((item) => item.identity !== identity));
    };

    if (livekitRoom) {
      livekitRoom.on(RoomEvent.TrackSubscribed, attach);
      livekitRoom.on(RoomEvent.TrackUnsubscribed, detach);
      // PK açılmadan önce yayında olan kameralar da eklenir.
      livekitRoom.remoteParticipants?.forEach((participant) => {
        participant.trackPublications?.forEach((pub) => {
          if (pub.track && pub.track.kind === Track.Kind.Video) attach(pub.track, participant);
        });
      });
    }

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play?.().catch(() => {});
        }
        videoTrack = stream.getVideoTracks()[0];
        if (livekitRoom && videoTrack) {
          try {
            publication = await livekitRoom.localParticipant.publishTrack(videoTrack, { source: Track.Source.Camera });
            publicationRef.current = publication;
          } catch (publishError) {
            console.warn('[PK] Kamera yayını başlatılamadı', publishError);
          }
        }
      } catch (cameraError) {
        if (cancelled) return;
        setError(cameraError?.name === 'NotAllowedError' || cameraError?.name === 'SecurityError'
          ? 'Kamera izni verilmedi. İzin verip tekrar dene.'
          : 'Kamera açılamadı. Cihazının kamerasını kontrol et.');
      }
    })();

    return () => {
      cancelled = true;
      if (livekitRoom) {
        livekitRoom.off?.(RoomEvent.TrackSubscribed, attach);
        livekitRoom.off?.(RoomEvent.TrackUnsubscribed, detach);
      }
      publicationRef.current = null;
      try { if (publication) livekitRoom?.localParticipant?.unpublishTrack?.(publication.track, true); } catch (error) {}
      try { videoTrack?.stop?.(); } catch (error) {}
      try { stream?.getTracks().forEach((track) => track.stop()); } catch (error) {}
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      setRemoteTracks([]);
    };
  }, [active, livekitRoom, selfId]);

  // Kamerayı kapatmak yayını susturur: karşı taraf kameranın kapalı olduğunu görür.
  const setCameraEnabled = useCallback((next) => {
    setCamOn(next);
    try {
      if (next) publicationRef.current?.track?.unmute?.();
      else publicationRef.current?.track?.mute?.();
    } catch (error) {
      console.warn('[PK] Kamera durumu değiştirilemedi', error);
    }
  }, []);

  return { localVideoRef, remoteTracks, error, camOn, setCameraEnabled, mirror: true };
}