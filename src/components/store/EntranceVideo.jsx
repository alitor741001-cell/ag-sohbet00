import { useEffect, useId, useRef, useState } from 'react';
import GiftTransparencyFilter from '@/components/voice/GiftTransparencyFilter';
import { cosmeticMediaUrl } from '@/lib/cosmeticMedia';
export default function EntranceVideo({ source, onDone, fallback = null }) {
  const [url, setUrl] = useState(''); const [failed, setFailed] = useState(false); const [playing, setPlaying] = useState(false); const video = useRef(null);
  const filterId = `entrance-video-${useId().replace(/:/g, '')}`;
  useEffect(() => {
    let alive = true;
    cosmeticMediaUrl(source).then(value => { if (alive) setUrl(value); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [source]);
  useEffect(() => { if (url && video.current) video.current.play().catch(() => setFailed(true)); }, [url]);
  if (!url || failed) return fallback;
  return <>
    {!playing && fallback}
    <GiftTransparencyFilter id={filterId} />
    <video ref={video} src={url} autoPlay muted playsInline preload="auto" onPlaying={() => setPlaying(true)} onError={() => setFailed(true)} onEnded={onDone} disablePictureInPicture aria-label="Yüzde 70 şeffaf VIP giriş videosu" className={`absolute inset-0 h-full w-full bg-transparent object-cover transition-opacity ${playing ? 'opacity-30' : 'opacity-0'}`} style={{ filter: `url(#${filterId})` }} />
  </>;
}