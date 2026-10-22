import { useEffect, useState } from 'react';
import { cosmeticMediaUrl, cosmeticArtwork } from '@/lib/cosmeticMedia';
import CosmeticArtwork from '@/components/store/CosmeticArtwork';
export default function EntrancePreview({ item }) {
  const [media, setMedia] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!item.video_url) return;
    Promise.all([cosmeticMediaUrl(item.video_url), cosmeticArtwork(item)]).then(([url, poster]) => { if (alive) setMedia({ url, poster }); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [item.id, item.video_url]);
  return <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-cabinet/40">
    {media && !failed ? <video src={media.url} poster={media.poster} controls muted playsInline preload="none" onError={() => setFailed(true)} aria-label={`${item.name}, gerçek giriş videosu ön izlemesi`} className="h-full w-full object-contain" /> : <CosmeticArtwork product={item} className="h-full w-full object-contain" />}
    {failed && <p role="status" className="absolute inset-x-0 bottom-0 bg-cabinet/90 p-1 text-center text-[10px] text-cabinet-ink">Video açılamadı.</p>}
  </div>;
}