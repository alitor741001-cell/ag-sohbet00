import { Clock } from 'lucide-react';
import { Image } from '@/components/ui/image';
import ProfileLiveLink from '@/components/profile/social/ProfileLiveLink';
import SocialPersonBadges from '@/components/profile/social/SocialPersonBadges';

export default function SocialPersonRow({ person, visitTime, liveRoom, onOpen, onJoin }) {
  return (
    <div className="flex w-full items-center gap-2 rounded-xl border border-fantasy-gold/25 bg-fantasy-text/[0.04] p-2.5">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99]">
        {person.avatar ? <Image src={person.avatar} alt="" fittingType="fill" className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-fantasy-gold/40" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fantasy-gold/10 font-black text-fantasy-gold">{(person.name || '?')[0]}</span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-fantasy-text">{person.name}</span>
          <span className="block text-xs font-semibold text-fantasy-text/45">{person.member_id ? `Üye No: ${person.member_id}` : 'Üye'}</span>
          <SocialPersonBadges person={person} />
          {visitTime && <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-fantasy-gold/80"><Clock className="h-3 w-3 shrink-0" />{visitTime}</span>}
        </span>
      </button>
      <ProfileLiveLink liveRoom={liveRoom} onJoin={onJoin} />
    </div>
  );
}