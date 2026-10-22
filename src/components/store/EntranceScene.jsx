import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Image } from '@/components/ui/image';
import { useReducedMotion } from 'framer-motion';
import CosmeticArtwork from '@/components/store/CosmeticArtwork';
import EntranceVideo from '@/components/store/EntranceVideo';
import '@/components/store/cabinet.css';
export default function EntranceScene({ person, reduced, dismiss, inline = false }) {
  const systemReduced = useReducedMotion(); const quiet = !!(reduced || systemReduced);
  const artwork = <CosmeticArtwork product={{ name: person.effect_name, image_url: person.image_url, crop: person.crop }} className={`${quiet ? '' : 'entrance-art'} h-full w-full object-contain opacity-30`} />;
  const scene = <aside aria-live="polite" data-reduced={quiet} data-vip={person.level} className={`entrance-scene pointer-events-none z-[260] w-60 max-w-[calc(100vw-2rem)] text-cabinet-ink ${inline ? 'absolute left-1/2 top-0 -translate-x-1/2' : 'fixed left-1/2 top-[calc(env(safe-area-inset-top)+5.25rem)] -translate-x-1/2'}`}>
    <div className="relative flex items-center gap-2 rounded-xl border border-cabinet-gold/40 bg-cabinet/90 px-2 py-1">
      {person.avatar ? <Image src={person.avatar} alt="" className="h-6 w-6 shrink-0 rounded-full border border-cabinet-gold" /> : <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cabinet-gold text-xs font-bold">{person.name?.[0]}</span>}
      <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold">{person.name}</p><p className="text-[9px] text-cabinet-gold">VIP {person.level} · Odaya katıldı</p></div>
      <button type="button" aria-label="Giriş efektini kapat" onClick={dismiss} className="pointer-events-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-cabinet-ink"><X className="h-3.5 w-3.5" /></button>
    </div>
    <div className="relative mt-0.5 h-10 w-full overflow-hidden rounded-lg bg-transparent mix-blend-screen">
      {person.video_url && !quiet ? <EntranceVideo key={person.id} source={person.video_url} onDone={dismiss} fallback={artwork} /> : artwork}
    </div>
  </aside>;
  return inline ? scene : createPortal(scene, document.body);
}