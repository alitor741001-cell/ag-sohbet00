import { formatNumber } from './poolFields';

/** Havuz muhasebe özeti: alınan bahis, ödenen kazanç, kesinti, rezerv ve kazanç dağılımı. */
export default function GamePoolStats({ pool }) {
  const rows = [
    ['Toplam bahis', pool.total_bet],
    ['Ödenen kazanç', pool.total_paid],
    ['Kesinti toplamı', pool.house_total],
    ['Rezerv', pool.reserve],
    ['Tur sayısı', pool.spins],
    ['Gerçekleşen RTP', `%${formatNumber(pool.realized_rtp)}`],
  ];
  const tiers = [
    ['Küçük', pool.wins_small], ['Orta', pool.wins_medium], ['Büyük', pool.wins_big], ['Çok büyük', pool.wins_huge],
  ];
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white/5 px-3 py-2">
            <p className="text-[11px] text-white/50">{label}</p>
            <p className="truncate text-sm font-bold text-white">{typeof value === 'string' ? value : formatNumber(value)}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] text-white/70">
        {tiers.map(([label, value]) => (
          <span key={label} className="rounded-full bg-white/5 px-2.5 py-1">{label}: <b className="text-white">{formatNumber(value)}</b></span>
        ))}
        <span className="rounded-full bg-white/5 px-2.5 py-1">Rezerv payı: <b className="text-white">%{formatNumber(pool.reserve_pct)}</b></span>
      </div>
    </div>
  );
}