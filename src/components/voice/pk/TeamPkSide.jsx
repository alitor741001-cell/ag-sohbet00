import { Crown } from 'lucide-react';

/** Takım paneli: kemerli neon çerçeve, taç başlık ve alt alta 4 koltuk (profil + sayı şeridi). */
export default function TeamPkSide({ tone, indices, renderSeat, size, space, hit }) {
  const blue = tone === 'blue';
  return (
    <div className={`team-pk-side team-pk-side-${tone} ${hit ? 'is-hit' : ''} flex w-[28%] shrink-0 flex-col items-center rounded-b-2xl rounded-t-[30px] border-2 px-0.5 pb-1.5 pt-1`}>
      <Crown className="team-pk-side-crown h-4 w-4" />
      <span className="text-[11px] font-black leading-none tracking-wide">{blue ? 'MAVİ' : 'KIRMIZI'}</span>
      <span className="mt-0.5 text-[10px] font-bold leading-none tracking-[0.12em] opacity-90">→ KOLTUKLAR ←</span>
      <div className="mt-1.5 flex flex-col items-center gap-1">
        {indices.map((index) => renderSeat(index, size, space))}
      </div>
    </div>
  );
}