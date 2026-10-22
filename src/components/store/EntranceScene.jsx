import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Image } from '@/components/ui/image';
import { useReducedMotion } from 'framer-motion';
import CosmeticArtwork from '@/components/store/CosmeticArtwork';
import EntranceVideo from '@/components/store/EntranceVideo';
import '@/components/store/cabinet.css';
export default function EntranceScene({ person, reduced, dismiss }) {
  const systemReduced = useReducedMotion(); const quiet = !!(reduced || systemReduced);
  const artwork = <CosmeticArtwork product={{ name: person.effect_name, image_url: person.image_url, crop: person.crop }} className={`${quiet ? '' : 'entrance-art'} h-full w-full object-contain opacity-30`} />;
  return createPortal(<aside aria-live="polite" data-reduced={quiet} data-vip={person.level} className="entrance-scene pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+5.25rem)] z-[260] mx-auto max-w-sm text-cabinet-ink">
    <div className="relative flex items-center gap-2.5 rounded-2xl border border-cabinet-gold/50 bg-gradient-to-r from-cabinet-surface/95 to-cabinet/95 px-3 py-2 shadow-lg">
      {person.avatar ? <Image src={person.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full border border-cabinet-gold" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cabinet-gold bg-cabinet text-sm font-black">{person.name?.[0]}</span>}
      <div className="min-w-0 flex-1"><p className="truncate text-xs font-black">{person.name}</p><p className="mt-0.5 text-[10px] text-cabinet-gold">VIP {person.level} · Odaya katıldı</p></div>
      <button type="button" aria-label="Giriş efektini kapat" onClick={dismiss} className="pointer-events-auto -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-cabinet-ink/70"><X className="h-4 w-4" /></button>
    </div>
    <div className="relative mt-1 h-24 w-full overflow-hidden rounded-2xl border-b border-cabinet-gold/25 bg-transparent mix-blend-screen sm:h-28">
      {person.video_url && !quiet ? <EntranceVideo key={person.id} source={person.video_url} onDone={dismiss} fallback={artwork} /> : artwork}
    </div>
  </aside>, document.body);
}