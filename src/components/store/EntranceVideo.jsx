import { useEffect, useRef, useState } from 'react';
import { cosmeticMediaUrl } from '@/lib/cosmeticMedia';
export default function EntranceVideo({ source, onDone }) {
  const [url, setUrl] = useState(''); const [failed, setFailed] = useState(false); const [playing, setPlaying] = useState(false); const video = useRef(null);
  useEffect(() => {
    let alive = true;
    cosmeticMediaUrl(source).then(value => { if (alive) setUrl(value); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [source]);
  useEffect(() => { if (url && video.current) video.current.play().catch(() => setFailed(true)); }, [url]);
  if (!url || failed) return null;
  return <video ref={video} src={url} autoPlay muted playsInline preload="metadata" onPlaying={() => setPlaying(true)} onError={() => setFailed(true)} onStalled={() => setFailed(true)} onEnded={onDone} aria-label="VIP giriş animasyonu" className={`absolute inset-0 h-full w-full rounded-3xl object-contain transition-opacity ${playing ? 'opacity-100' : 'opacity-0'}`} />;
}