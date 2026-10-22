import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useEntranceVideoProduction from '@/hooks/useEntranceVideoProduction';
import usePageScrollLock from '@/hooks/usePageScrollLock';
import CosmeticArtwork from '@/components/store/CosmeticArtwork';
export default function VideoProduction({ product, onClose }) {
  const video = useEntranceVideoProduction(product); usePageScrollLock(true);
  const processing = ['queued','in_progress'].includes(video.job.status);
  return createPortal(<div role="dialog" aria-modal="true" aria-label="Gerçek video üretimi" className="cosmetic-cabinet fixed inset-0 z-[400] overflow-y-auto overscroll-contain p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]"><div className="mx-auto max-w-md">
    <header className="flex items-center justify-between gap-3"><h2 className="text-lg font-black text-cabinet-gold">{product.name}</h2><button type="button" aria-label="Kapat" onClick={onClose} className="flex h-11 w-11 items-center justify-center"><X /></button></header>
    <CosmeticArtwork product={product} className="mx-auto my-5 h-52 w-52 object-contain" />
    <p className="text-sm leading-relaxed text-cabinet-ink/75">Orijinal görseldeki karakter veya araç korunarak 6 saniyelik, sessiz, dikey 720p video üretilir. Üretim entegrasyon kredisi harcar; önce maliyeti görüntüle. Hazır olana kadar odalarda hareketli görsel yedeği çalışır.</p>
    {video.job.url && <video src={video.job.url} controls playsInline preload="metadata" aria-label={`${product.name} giriş videosu`} className="mx-auto mt-4 max-h-80 w-full rounded-2xl" />}
    {processing && <p role="status" className="mt-4 text-sm text-cabinet-gold">Video üretiliyor. Bu pencereyi kapatıp daha sonra devam edebilirsin.</p>}
    {!processing && !video.job.url && <div className="mt-4 space-y-3"><button type="button" disabled={video.busy} onClick={video.quote} className="min-h-11 w-full rounded-xl border border-cabinet-gold/50 text-sm disabled:opacity-50">{video.busy ? 'Hazırlanıyor…' : 'Üretim maliyetini göster'}</button>{video.estimate != null && <><p className="text-sm text-cabinet-gold">Tahmini {video.estimate} entegrasyon kredisi; son maliyet farklı olabilir.</p><button type="button" disabled={video.busy} onClick={video.generate} className="min-h-11 w-full rounded-xl bg-primary px-3 font-bold text-primary-foreground disabled:opacity-50">Onayla ve gerçek video üret</button></>}</div>}
    {video.waiting && <button type="button" onClick={video.resume} className="mt-4 min-h-11 w-full rounded-xl border border-cabinet-gold/40">Üretim durumunu tekrar kontrol et</button>}
    {video.error && <p role="alert" className="mt-4 text-sm text-destructive">{video.error}</p>}
  </div></div>, document.body);
}