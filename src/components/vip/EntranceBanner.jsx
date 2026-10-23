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
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[260] h-14 overflow-hidden" aria-live="polite">
      <div className={`entry-banner entry-${tier}`} onAnimationEnd={onDone}>
        <div className="entry-badge">
          {person.avatar
            ? <Image src={person.avatar} alt="" className="h-full w-full rounded-full" />
            : <Icon className="h-5 w-5" />}
          {tier !== 'basic' && <span className="entry-level">V{person.level}</span>}
        </div>
        <p className="entry-text">
          <span className="entry-name">{person.name}</span> odaya katıldı
        </p>
        <span className="entry-shine" />
      </div>
    </div>
  );
}