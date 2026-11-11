import formatCoinAmount from '@/components/voice/formatCoinAmount';
import '@/components/voice/pk/pkScoreFaces.css';

const FACES = {
  happy: { emoji: '😆', className: 'pk-face-happy' },
  sad: { emoji: '😭', className: 'pk-face-sad' },
  even: { emoji: '😐', className: 'pk-face-even' },
};

/**
 * PK skor şeridi: solda pembe, sağda camgöbeği; ortada boks eldiveni ve süre.
 * İki barın birleştiği uçta 3D hareketli yüzler durur ve bar ilerledikçe birlikte kayar:
 * önde olan taraf güler, geride kalan taraf ağlar.
 */
export default function PkScoreBar({ leftScore = 0, rightScore = 0, timerText = '00:00' }) {
  const total = leftScore + rightScore;
  const left = total > 0 ? Math.min(92, Math.max(8, Math.round((leftScore / total) * 100))) : 50;
  const leading = leftScore === rightScore ? '' : leftScore > rightScore ? 'left' : 'right';
  const mood = (side) => FACES[leading === '' ? 'even' : leading === side ? 'happy' : 'sad'];
  const leftFace = mood('left');
  const rightFace = mood('right');

  return (
    <div className="relative shrink-0 px-2 pb-1">
      <div className="relative">
        <div className="flex h-7 overflow-hidden rounded-full bg-white/10">
          <span
            className="flex items-center gap-1 pl-2.5 pr-6 text-[11.5px] font-black tabular-nums text-white transition-[width] duration-500"
            style={{ width: `${left}%`, background: 'linear-gradient(90deg,#fe2c55,#ff5b7a)' }}
          >
            {formatCoinAmount(leftScore)}
          </span>
          <span
            className="flex flex-1 items-center justify-end gap-1 pl-6 pr-2.5 text-[11.5px] font-black tabular-nums text-black/80"
            style={{ background: 'linear-gradient(270deg,#25f4ee,#8ffaf6)' }}
          >
            {formatCoinAmount(rightScore)}
          </span>
        </div>
        {/* Yüzler iki barın buluştuğu uçta: her biri kendi barının önünde ilerler. */}
        <span
          className="pk-face-track pointer-events-none absolute top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5"
          style={{ left: `${left}%` }}
        >
          <span className={`pk-face ${leftFace.className}`}>{leftFace.emoji}</span>
          <span className="h-6 w-[2px] rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
          <span className={`pk-face ${rightFace.className}`}>{rightFace.emoji}</span>
        </span>
      </div>
      {/* Süre barın altına alınır: hareketli yüzler ortaya geldiğinde üst üste binmez. */}
      <span className="absolute left-1/2 top-full z-20 flex -translate-x-1/2 -translate-y-[85%] items-center gap-1 rounded-full bg-black/85 px-2 py-0.5 ring-1 ring-white/25">
        <span className="text-[11px] leading-none">🥊</span>
        <span className="text-[10px] font-black tabular-nums text-white">{timerText}</span>
      </span>
    </div>
  );
}