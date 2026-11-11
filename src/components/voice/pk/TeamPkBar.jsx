import { useEffect, useState } from 'react';
import { Clock, RotateCcw, Swords, X } from 'lucide-react';
import formatCoinAmount from '@/components/voice/formatCoinAmount';
import '@/components/voice/pk/teamPkArena.css';

const clock = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

/** Normal PK barı: mavi (sol) ve kırmızı (sağ) takım puanları, ortada PK rozeti ve 5 dakikalık sayaç. */
export default function TeamPkBar({ match, canMod, onRestart, onStop }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = Math.max(0, Math.ceil((new Date(match.ends_at).getTime() - now) / 1000));
  const blue = (Number(match.blue_score) || 0) * 1000;
  const red = (Number(match.red_score) || 0) * 1000;
  const total = blue + red;
  const left = total > 0 ? Math.min(85, Math.max(15, Math.round((blue / total) * 100))) : 50;
  const finished = remaining === 0;
  const result = blue === red ? 'Berabere' : blue > red ? 'Mavi takım kazandı' : 'Kırmızı takım kazandı';

  return (
    <div className="mt-2 w-full px-0.5">
      <div className="relative pb-4">
        <div className="team-pk-bar-track flex h-8 overflow-hidden rounded-full">
          <span className="team-pk-bar-blue flex items-center pl-3 text-sm font-black tabular-nums text-white transition-[width] duration-500" style={{ width: `${left}%` }}>
            {formatCoinAmount(blue)}
          </span>
          <span className="team-pk-bar-red flex flex-1 items-center justify-end pr-3 text-sm font-black tabular-nums text-white">
            {formatCoinAmount(red)}
          </span>
        </div>
        <div className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center">
          <span className="team-pk-badge flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-black">
            <Swords className="h-3.5 w-3.5" /> PK <Swords className="h-3.5 w-3.5" />
          </span>
          <span className="team-pk-badge -mt-0.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums text-white">
            <Clock className="h-3 w-3 text-amber-300" /> {clock(remaining)}
          </span>
        </div>
      </div>
      {(finished || canMod) && (
        <div className="mt-1 flex items-center justify-center gap-2 px-2">
          {finished && <span className="text-[11px] font-black text-amber-300">{result}</span>}
          {canMod && finished && (
            <button type="button" onClick={onRestart} className="flex h-7 items-center gap-1 rounded-full bg-emerald-500 px-2.5 text-[10.5px] font-black text-black active:scale-95">
              <RotateCcw className="h-3 w-3" /> Yeniden
            </button>
          )}
          {canMod && (
            <button type="button" onClick={onStop} className="flex h-7 items-center gap-1 rounded-full bg-white/15 px-2.5 text-[10.5px] font-black text-white ring-1 ring-white/30 active:scale-95">
              <X className="h-3 w-3" /> PK'yı kapat
            </button>
          )}
        </div>
      )}
    </div>
  );
}