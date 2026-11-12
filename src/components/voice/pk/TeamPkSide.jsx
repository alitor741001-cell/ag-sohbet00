import { Crown } from 'lucide-react';

/** Takım paneli: kemerli neon çerçeve, taç başlık ve 2x2 koltuk (profil + sayı şeridi). Önde olan takımın profillerinde silah durur. */
export default function TeamPkSide({ tone, indices, renderSeat, size, space, hit, armed, seats = [] }) {
  const blue = tone === 'blue';
  return (
    <div className={`team-pk-side team-pk-side-${tone} ${hit ? 'is-hit' : ''} flex min-w-0 flex-1 flex-col items-center rounded-b-2xl rounded-t-[22px] border-2 px-0.5 pb-1 pt-0.5`}>
      <Crown className="team-pk-side-crown h-3.5 w-3.5" />
      <span className="text-[10px] font-black leading-none tracking-wide">{blue ? 'MAVİ' : 'KIRMIZI'} KOLTUKLAR</span>
      <div className="mt-2 grid w-full grid-cols-3 justify-items-center gap-x-1.5 gap-y-3">
        {indices.map((index, position) => (
          <div key={index} className={`relative ${indices.length % 3 === 1 && position === indices.length - 1 ? 'col-start-2' : ''}`}>
            {renderSeat(index, size, space)}
          </div>
        ))}
      </div>
    </div>
  );
}