import { Image } from '@/components/ui/image';

/** Sıralamada ilk üç kişinin profil çerçevesi: 1 altın, 2 gümüş-mavi, 3 bronz. */
const RANKS = {
  1: {
    label: 'TOP1',
    ring: 'bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600',
    badge: 'bg-gradient-to-b from-amber-100 to-amber-500 text-amber-950',
    glow: 'shadow-[0_0_14px_rgba(251,191,36,0.65)]',
  },
  2: {
    label: 'TOP2',
    ring: 'bg-gradient-to-br from-slate-100 via-sky-300 to-indigo-500',
    badge: 'bg-gradient-to-b from-slate-50 to-sky-400 text-slate-900',
    glow: 'shadow-[0_0_14px_rgba(148,163,184,0.65)]',
  },
  3: {
    label: 'TOP3',
    ring: 'bg-gradient-to-br from-orange-200 via-amber-600 to-red-700',
    badge: 'bg-gradient-to-b from-orange-200 to-red-600 text-red-950',
    glow: 'shadow-[0_0_14px_rgba(249,115,22,0.6)]',
  },
};

export default function GiftRankFrame({ rank, avatar, name = 'Kullanıcı' }) {
  const decor = RANKS[rank];
  const portrait = (
    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10">
      {avatar
        ? <Image src={avatar} alt={name} className="h-full w-full" fittingType="fill" draggable={false} />
        : <span className="text-xs font-bold text-white/80">{name.trim().charAt(0)}</span>}
    </span>
  );

  if (!decor) return <span className="shrink-0 rounded-full border border-white/15">{portrait}</span>;

  return (
    <span className={`relative shrink-0 rounded-full p-[2px] ${decor.ring} ${decor.glow}`}>
      <span className="block rounded-full bg-black/50 p-[2px]">{portrait}</span>
      <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[8px] font-black leading-none ${decor.badge}`}>
        {decor.label}
      </span>
    </span>
  );
}