import { Star } from 'lucide-react';
import TeamPkSide from '@/components/voice/pk/TeamPkSide';
import PkThemeBackdrop from '@/components/voice/pk/PkThemeBackdrop';
import '@/components/voice/pk/teamPkArena.css';

/**
 * Normal PK sahnesi: ortada sunucu koltuğu ve taç zemini, solda mavi, sağda kırmızı
 * üç sütunlu koltuk düzeni; mevcut koltuklar ve takım üyelikleri korunur.
 * Her koltuğun altında aldığı hediyelerin sayı şeridi bulunur.
 */
export default function TeamPkArena({ match, seats, renderSeat, footer, width = 360 }) {
  const cellWidth = (width - 48) / 6;
  const size = cellWidth >= 88 ? 'lg' : cellWidth >= 68 ? 'md' : cellWidth >= 52 ? 'sm' : 'xs';
  const space = { xs: 42, sm: 52, md: 68, lg: 88 }[size];

  return (
    <div className="team-pk-arena relative isolate w-full">
      <PkThemeBackdrop />
      <div className="relative z-10 flex w-full flex-col items-center gap-2">
        <div className="flex flex-col items-center">
          <span className="team-pk-host-label flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black">
            <Star className="h-2.5 w-2.5 fill-current" /> SUNUCU <Star className="h-2.5 w-2.5 fill-current" />
          </span>
          {renderSeat(0, size, space)}
        </div>
        <div className="flex w-full items-stretch justify-between gap-3">
          <TeamPkSide tone="blue" indices={[1, 2, 3, 4]} renderSeat={renderSeat} size={size} space={space} />
          <TeamPkSide tone="red" indices={[5, 6, 7, 8]} renderSeat={renderSeat} size={size} space={space} />
        </div>
      </div>
      {footer}
    </div>
  );
}