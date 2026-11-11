import { useCallback, useState } from 'react';
import { Crown, Star } from 'lucide-react';
import TeamPkSide from '@/components/voice/pk/TeamPkSide';
import TeamPkShots from '@/components/voice/pk/TeamPkShots';
import '@/components/voice/pk/teamPkArena.css';

/**
 * Normal PK sahnesi: ortada sunucu koltuğu ve taç zemini, solda mavi, sağda kırmızı
 * 4'er koltuk; her koltuğun altında aldığı hediyelerin sayı şeridi. Hediye gelince
 * takım rakibe ateş eder. Alt kısımda PK barı durur.
 */
export default function TeamPkArena({ match, renderSeat, footer, width = 360, heightBudget }) {
  const [hit, setHit] = useState('');
  const onHit = useCallback((side) => {
    setHit(side);
    window.setTimeout(() => setHit(''), 750);
  }, []);
  const size = !heightBudget || heightBudget >= 450 ? 'sm' : 'xs';
  const space = Math.max(46, Math.round(width * 0.28) - 8);

  return (
    <div className="team-pk-arena relative w-full rounded-[22px] p-1.5">
      <div className="relative flex w-full items-stretch gap-1">
        <TeamPkSide tone="blue" indices={[1, 2, 3, 4]} renderSeat={renderSeat} size={size} space={space} hit={hit === 'blue'} />
        <div className="relative flex min-w-0 flex-1 flex-col items-center">
          <Crown className="h-4 w-4 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
          <span className="team-pk-host-label flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide">
            <Star className="h-2.5 w-2.5 fill-current" /> SUNUCU KOLTUĞU <Star className="h-2.5 w-2.5 fill-current" />
          </span>
          <div className="relative mt-2 flex flex-col items-center">
            <span className="team-pk-platform pointer-events-none absolute left-1/2 top-[38px] h-7 w-24 -translate-x-1/2" />
            <div className="relative z-10">{renderSeat(0, size === 'sm' ? 'md' : 'sm', space + 20)}</div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center py-2">
            <span className="team-pk-floor-crown flex h-14 w-24 items-center justify-center">
              <Crown className="h-8 w-8" />
            </span>
          </div>
        </div>
        <TeamPkSide tone="red" indices={[5, 6, 7, 8]} renderSeat={renderSeat} size={size} space={space} hit={hit === 'red'} />
        <TeamPkShots blue={Number(match?.blue_score) || 0} red={Number(match?.red_score) || 0} onHit={onHit} />
      </div>
      {footer}
    </div>
  );
}