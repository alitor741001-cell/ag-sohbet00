import { Crown } from 'lucide-react';

const COIN = { background: 'linear-gradient(180deg, #FFE9A3 0%, #F5B31A 55%, #D98E06 100%)', boxShadow: '0 2px 5px rgba(0,0,0,0.55)' };

/** Altın coin yığını illüstrasyonu — başlığın iki yanında aynalı kullanılır. */
export default function CoinStack({ flip }) {
  return (
    <div className={`relative h-[68px] w-[54px] shrink-0 ${flip ? '-scale-x-100' : ''}`}>
      {[0, 1, 2, 3].map((index) => (
        <span
          key={index}
          className="absolute left-1 h-3 w-11 rounded-[50%]"
          style={{ ...COIN, bottom: index * 7 }}
        />
      ))}
      <span
        className="absolute h-3 w-11 rounded-[50%]"
        style={{ ...COIN, bottom: 28, left: 7, boxShadow: '0 0 12px rgba(245,179,26,0.45)' }}
      />
      <Crown
        className="absolute left-1/2 h-[22px] w-[22px] -translate-x-1/2 text-amber-300"
        style={{ bottom: 36, filter: 'drop-shadow(0 0 6px rgba(255,214,102,0.75))' }}
      />
      <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-amber-200/80" />
      <span className="absolute bottom-1 right-0.5 h-1 w-1 rounded-full bg-amber-200/60" />
    </div>
  );
}