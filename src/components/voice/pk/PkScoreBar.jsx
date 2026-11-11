import formatCoinAmount from '@/components/voice/formatCoinAmount';

/**
 * PK skor şeridi: solda pembe, sağda camgöbeği; ortada boks eldiveni ve süre.
 * Bar ilerledikçe önde olan taraf güler, geride kalan taraf üzülür.
 */
export default function PkScoreBar({ leftScore = 0, rightScore = 0, timerText = '00:00' }) {
  const total = leftScore + rightScore;
  const left = total > 0 ? Math.max(8, Math.round((leftScore / total) * 100)) : 50;
  const leading = leftScore === rightScore ? '' : leftScore > rightScore ? 'left' : 'right';
  const face = (side) => (leading === '' ? '😐' : leading === side ? '😄' : '😢');

  return (
    <div className="relative shrink-0 px-2 pb-1">
      <div className="flex h-7 overflow-hidden rounded-full bg-white/10">
        <span
          className="flex items-center gap-1 pl-2.5 pr-6 text-[11.5px] font-black tabular-nums text-white transition-[width] duration-500"
          style={{ width: `${left}%`, background: 'linear-gradient(90deg,#fe2c55,#ff5b7a)' }}
        >
          <span className="text-[13px] leading-none">{face('left')}</span>
          {formatCoinAmount(leftScore)}
        </span>
        <span
          className="flex flex-1 items-center justify-end gap-1 pl-6 pr-2.5 text-[11.5px] font-black tabular-nums text-black/80"
          style={{ background: 'linear-gradient(270deg,#25f4ee,#8ffaf6)' }}
        >
          {formatCoinAmount(rightScore)}
          <span className="text-[13px] leading-none">{face('right')}</span>
        </span>
      </div>
      <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-black/85 px-2 py-0.5 ring-1 ring-white/25">
        <span className="text-[11px] leading-none">🥊</span>
        <span className="text-[10px] font-black tabular-nums text-white">{timerText}</span>
      </span>
    </div>
  );
}