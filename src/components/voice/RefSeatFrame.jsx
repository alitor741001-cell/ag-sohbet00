import RefSprite from '@/components/voice/refSprite';

// Tasarım görselindeki 24 çerçeveli koltuğun konumları (6 sütun x 4 satır).
const COLS = [12, 159, 297, 432, 570, 710];
const ROWS = [291, 500, 697, 895];

/** Koltuğun tasarımdaki çerçevesi; ortadaki daire alanına içerik (profil) konur. */
export default function RefSeatFrame({ index, children }) {
  const i = index % 24;
  return (
    <RefSprite x={COLS[i % 6]} y={ROWS[Math.floor(i / 6)]} w={145} h={185} className="w-full">
      {children && (
        <span className="absolute left-1/2 top-[44%] flex aspect-square w-[52%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-black">
          {children}
        </span>
      )}
    </RefSprite>
  );
}