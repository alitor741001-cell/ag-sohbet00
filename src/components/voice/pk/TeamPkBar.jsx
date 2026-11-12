import { useEffect, useState } from 'react';
import { Flag, X } from 'lucide-react';
import { formatCoins } from '@/lib/giftTone';
import '@/components/voice/pk/teamPkArena.css';

const clock = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
export default function TeamPkBar({ match, canMod, onRestart, onStop }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const started = !!match.started_at && !!match.ends_at;
  const remaining = started ? Math.max(0, Math.ceil((new Date(match.ends_at).getTime() - now) / 1000)) : 300;
  const blue = (Number(match.blue_score) || 0) * 1000;
  const red = (Number(match.red_score) || 0) * 1000;
  const finished = started && remaining === 0;
  const redPercent = red + blue ? Math.max(5, Math.min(95, red / (red + blue) * 100)) : 50;
  return (
    <div className="team-pk-footer">
      {canMod && (!started || finished) && <button type="button" onClick={onRestart} className="team-pk-start">{finished ? 'Yeniden Başlat' : 'Başlat'}</button>}
      {started && !finished && <span className="team-pk-clock">{clock(remaining)}</span>}
      <div className="team-pk-score-track">
        <span className="team-pk-score-red" style={{ width: `${redPercent}%` }} />
        <span className="team-pk-score-label">{started ? formatCoins(red) : 'Hazırlanıyor'}</span>
        <span className="team-pk-score-label">{started ? formatCoins(blue) : 'Hazırlanıyor'}</span>
      </div>
      <div className="team-pk-footer-title"><Flag /><strong>Takım savaşı</strong><Flag /></div>
      {finished && <p className="team-pk-result">{blue === red ? 'Berabere' : blue > red ? 'Mavi takım kazandı' : 'Kırmızı takım kazandı'}</p>}
      {canMod && started && !finished && <button type="button" onClick={onStop} className="team-pk-stop"><X className="h-3 w-3" /> Maçı bitir</button>}
    </div>
  );
}