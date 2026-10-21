import { Crown, Flame, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import ProfileFrame from '@/components/ProfileFrame';

export default function VoiceFantasyHero({ female, hidden, name, avatar, role, onClose }) {
  const Emblem = female ? Crown : Flame;
  return (
    <header className="voice-fantasy-hero relative isolate overflow-hidden rounded-t-[2rem] px-5 pb-4 pt-5">
      {!hidden && <Image src={female ? 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/13118d5f1_generated_image.png' : 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/0079dc925_generated_image.png'} alt="" className="absolute inset-0 -z-20 h-full w-full" />}
      <div className="voice-fantasy-shade absolute inset-0 -z-10" />
      <button type="button" onClick={onClose} aria-label="Kartı kapat" className="voice-fantasy-button absolute right-3 top-3 rounded-full p-2"><X className="h-4 w-4" /></button>
      <div className="mb-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-fantasy-gold"><Emblem className="h-4 w-4" />{hidden ? 'GİZLİ PROFİL' : female ? 'PRENSESİN SARAYI' : 'EJDERHANIN KRALLIĞI'}</div>
      <div className="mx-auto w-fit rounded-full border-2 border-fantasy-gold p-1 shadow-lg"><ProfileFrame avatar={avatar} name={name} size="md" /></div>
      <h2 className="mt-2 break-words text-center font-serif text-2xl font-bold text-fantasy-text">{name}</h2>
      {role && <p className="mt-1 text-center text-[10px] font-bold tracking-widest text-fantasy-gold">{role}</p>}
    </header>
  );
}