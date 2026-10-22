import { Gem, AudioLines } from 'lucide-react';
import { Image } from '@/components/ui/image';
export default function BagOrbs({ groups = [] }) {
  return <div className="cabinet-shelf-line mx-auto flex w-full max-w-xl justify-center gap-5 px-5 pb-5 pt-3">{[['frame','Profil Çerçevesi',Gem],['mic','Ses Dalgası',AudioLines]].map(([kind,label,Icon]) => {
    const active = groups.find(g => g.kind===kind)?.items.find(i => i.equipped);
    return <div key={kind} className="flex min-w-0 flex-1 flex-col items-center gap-2"><div className="cabinet-orb relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-cabinet-gold sm:h-20 sm:w-20">{active ? <Image src={active.theme.image} alt={label} fittingType="fit" className="h-full w-full" /> : <Icon className="h-7 w-7 text-cabinet-gold" />}</div><p className="text-center text-[10px] font-bold text-cabinet-gold">{label}</p><p className="text-[10px] text-cabinet-ink/65">{active ? `VIP ${active.level}` : 'Seçili değil'}</p></div>;
  })}</div>;
}