import { Crown, Gem, User } from 'lucide-react';
import { Image } from '@/components/ui/image';
import '@/components/vip/entranceBanner.css';

// Kademe: VIP 10-12 "elite", VIP 5-9 "vip", diğerleri "basic".
function tierOf(level) {
  if (level >= 10) return 'elite';
  if (level >= 5) return 'vip';
  return 'basic';
}

/** Odaya giriş şeridi: sağdan gelir, ortada 3 sn durur, sola kayıp çıkar. */
export default function EntranceBanner({ person, onDone }) {
  const tier = tierOf(person.level || 0);
  const Icon = tier === 'elite' ? Crown : tier === 'vip' ? Gem : User;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[max(env(safe-area-inset-top),0px)] z-[260] h-14 overflow-hidden" aria-live="polite">
      <div className={`entry-banner entry-${tier}`} onAnimationEnd={onDone}>
        <div className="entry-badge">
          {person.avatar
            ? <Image src={person.avatar} alt="" className="h-full w-full rounded-full" />
            : <Icon className="h-5 w-5" />}
          {tier !== 'basic' && <span className="entry-level">V{person.level}</span>}
        </div>
        <p className="entry-text flex min-w-0 items-center gap-1">
          {person.n_level > 0 && <span className="shrink-0 rounded-full border border-[#cfd8dc] bg-[#4b664d] px-1.5 text-[9px] font-black text-white">N{person.n_level}</span>}
          {person.level >= 5 && <span className="shrink-0 rounded-full bg-gradient-to-r from-[#fde68a] to-[#f59e0b] px-1.5 text-[9px] font-black text-[#3a2400]">VIP{person.level}</span>}
          {person.sent_level > 0 && <span className="shrink-0 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] px-1.5 text-[9px] font-black text-[#20160a]">★{person.sent_level}</span>}
          <span className="entry-name truncate">{person.name}</span> <span className="shrink-0">katıldı</span>
        </p>
        <span className="entry-shine" />
      </div>
    </div>
  );
}