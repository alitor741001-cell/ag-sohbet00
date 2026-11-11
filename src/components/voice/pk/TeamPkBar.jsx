import { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import PkScoreBar from '@/components/voice/pk/PkScoreBar';

const BLUE_RED = { left: 'linear-gradient(90deg,#1d4ed8,#3b82f6)', right: 'linear-gradient(270deg,#b91c1c,#ef4444)', rightText: 'text-white' };
const clock = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

/** Normal PK barı: mavi (sol) ve kırmızı (sağ) takım puanları, 5 dakikalık sayaç ve sonuç. */
export default function TeamPkBar({ match, canMod, onRestart, onStop }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const endsAt = new Date(match.ends_at).getTime();
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const blue = (Number(match.blue_score) || 0) * 1000;
  const red = (Number(match.red_score) || 0) * 1000;
  const finished = remaining === 0;
  const result = blue === red ? 'Berabere' : blue > red ? 'Mavi takım kazandı' : 'Kırmızı takım kazandı';

  return (
    <div className="mt-2 w-full">
      <PkScoreBar leftScore={blue} rightScore={red} timerText={clock(remaining)} colors={BLUE_RED} />
      {(finished || canMod) && (
        <div className="mt-2.5 flex items-center justify-center gap-2 px-2">
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