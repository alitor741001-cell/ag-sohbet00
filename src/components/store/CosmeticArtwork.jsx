import { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import { cosmeticArtwork } from '@/lib/cosmeticMedia';
import { frameDesignFor } from '@/lib/frameCollection';
import AnimatedFrame from '@/components/store/AnimatedFrame';
export default function CosmeticArtwork({ product, className = '', ...props }) {
  const [source, setSource] = useState(''); const [failed, setFailed] = useState(false);
  const signature = JSON.stringify([product?.image_url, product?.crop, product?.remove_white]);
  useEffect(() => {
    let alive = true; setSource(''); setFailed(false);
    if (product?.image_url) cosmeticArtwork(product).then(url => { if (alive) setSource(url); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [signature]);
  const frame = frameDesignFor(product?.image_url);
  return source ? frame ? <AnimatedFrame frame={frame} source={source} className={className} {...props} /> : <Image src={source} fittingType="fit" alt={product.name || ''} className={`${className} mix-blend-multiply`} {...props} />
    : <span className={`inline-flex items-center justify-center text-xs text-cabinet-ink/60 ${className}`} role={failed ? 'img' : undefined} aria-label={failed ? 'Görsel yüklenemedi' : 'Görsel hazırlanıyor'}>{failed ? 'Görsel yüklenemedi' : '…'}</span>;
}