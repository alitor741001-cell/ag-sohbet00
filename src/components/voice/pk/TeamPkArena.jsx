import { useCallback, useState } from 'react';
import { Crown, Star } from 'lucide-react';
import TeamPkSide from '@/components/voice/pk/TeamPkSide';
import TeamPkShots from '@/components/voice/pk/TeamPkShots';
import '@/components/voice/pk/teamPkArena.css';

/**
 * Normal PK sahnesi: ortada sunucu koltuğu ve taç zemini, solda mavi, sağda kırmızı
 * 2x2 koltuk; her koltuğun altında aldığı hediyelerin sayı şeridi. Hediye gelince
 * takım rakibe ateş eder; önde olan takım silahıyla 5 saniyede bir ateş eder.
 */
export default function TeamPkArena({ match, seats, renderSeat, footer, width = 360 }) {
  const [hit, setHit] = useState('');
  const onHit = useCallback((side) => {
    setHit(side);
    window.setTimeout(() => setHit(''), 750);
  }, []);
  const size = width >= 440 ? 'sm' : 'xs';
  const space = Math.max(44, Math.round(width * 0.15));
  const blue = Number(match?.blue_score) || 0;
  const red = Number(match?.red_score) || 0;
  const leader = blue === red ? '' : blue > red ? 'blue' : 'red';

  return (
    <div className="team-pk-arena relative w-full rounded-[18px] p-1">
      <div className="relative flex w-full items-stretch gap-1">
        <TeamPkSide tone="blue" indices={[1, 2, 3, 4]} seats={seats} renderSeat={renderSeat} size={size} space={space} hit={hit === 'blue'} armed={leader === 'blue'} />
        <div className="relative flex min-w-0 flex-1 flex-col items-center">
          <span className="team-pk-host-label flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-black tracking-wide">
            <Star className="h-2.5 w-2.5 fill-current" /> SUNUCU <Star className="h-2.5 w-2.5 fill-current" />
          </span>
          <div className="relative mt-1 flex flex-col items-center">
            <span className="team-pk-platform pointer-events-none absolute left-1/2 top-[30px] h-5 w-20 -translate-x-1/2" />
            <div className="relative z-10">{renderSeat(0, size === 'sm' ? 'md' : 'sm', space + 20)}</div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center py-1">
            <span className="team-pk-floor-crown flex h-9 w-16 items-center justify-center">
              <Crown className="h-5 w-5" />
            </span>
          </div>
        </div>
        <TeamPkSide tone="red" indices={[5, 6, 7, 8]} seats={seats} renderSeat={renderSeat} size={size} space={space} hit={hit === 'red'} armed={leader === 'red'} />
        <TeamPkShots blue={blue} red={red} leader={leader} onHit={onHit} />
      </div>
      {footer}
    </div>
  );
}