import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Image } from '@/components/ui/image';
import { useReducedMotion } from 'framer-motion';
import CosmeticArtwork from '@/components/store/CosmeticArtwork';
import EntranceVideo from '@/components/store/EntranceVideo';
import '@/components/store/cabinet.css';
export default function EntranceScene({ person, reduced, dismiss }) {
  const systemReduced = useReducedMotion(); const quiet = !!(reduced || systemReduced);
  return createPortal(<aside aria-live="polite" data-reduced={quiet} data-vip={person.level} className="entrance-scene pointer-events-none fixed inset-x-3 top-1/2 z-[260] mx-auto flex max-w-sm -translate-y-1/2 flex-col items-center text-cabinet-ink">
    <div className="relative flex aspect-square max-h-[45dvh] w-full items-center justify-center overflow-hidden rounded-3xl bg-cabinet/35">
      <span className="entrance-energy absolute inset-5 rounded-full border-2 border-cabinet-gold/60" />
      <span className="entrance-energy absolute inset-10 rounded-full border border-cabinet-light/80" style={{ animationDelay: '1s' }} />
      <CosmeticArtwork product={{ name: person.effect_name, image_url: person.image_url, crop: person.crop }} className="entrance-art relative h-full w-full object-contain opacity-90" />
      {person.video_url && !quiet && <EntranceVideo key={person.id} source={person.video_url} onDone={dismiss} />}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-t from-cabinet/55 via-transparent to-transparent">
        {person.avatar ? <Image src={person.avatar} alt="" className="h-16 w-16 rounded-full border-2 border-cabinet-gold shadow-lg" /> : <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-cabinet-gold bg-cabinet text-xl font-black">{person.name?.[0]}</span>}
        <p className="max-w-[85%] rounded-full bg-cabinet/80 px-4 py-1 text-center text-sm font-black">{person.name}</p><p className="rounded-full bg-cabinet/85 px-3 py-1 text-xs font-black text-cabinet-gold">VIP {person.level} · Odaya katıldı</p>
      </div>
      <button type="button" aria-label="Giriş efektini kapat" onClick={dismiss} className="pointer-events-auto absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-cabinet/90"><X className="h-5 w-5" /></button>
    </div>
  </aside>, document.body);
}