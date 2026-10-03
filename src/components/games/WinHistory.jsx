import React, { useCallback, useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const VISIBLE = 10;

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

const clock = (value) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

function Stat({ label, value, tone = 'text-white' }) {
  return (
    <span className="rounded-lg bg-slot-panel px-2 py-1.5 text-center">
      <span className={`block font-mono text-xs font-black tabular-nums ${tone}`}>{value}</span>
      <span className="block text-[9px] font-black tracking-wider text-white/50">{label}</span>
    </span>
  );
}

/** Kazanç geçmişi: kullanıcının son turları, kazandığı coinler ve bakiyesi. */
export default function WinHistory() {
  const [spins, setSpins] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    try {
      const response = await base44.functions.invoke('slot-game', { action: 'history' });
      setSpins(response.data?.spins || []);
      setSummary(response.data?.summary || null);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="mt-3 rounded-2xl border border-slot-border bg-slot-surface p-3">
      <header className="flex items-center gap-2">
        <History className="h-4 w-4 text-slot-gold" />
        <p className="min-w-0 flex-1 truncate text-[11px] font-black tracking-widest text-slot-gold">KAZANÇ GEÇMİŞİ</p>
      </header>

      {summary && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <Stat label="TOPLAM KAZANÇ" value={format(summary.total_won)} tone="text-slot-green" />
          <Stat label="TUR" value={format(summary.spins)} />
          <Stat label="BAKİYE" value={format(summary.coins)} />
        </div>
      )}

      {status === 'loading' && <p className="mt-2 text-center text-[11px] text-white/60">Yükleniyor...</p>}

      {status === 'error' && <p className="mt-2 text-center text-[11px] text-white/60">Geçmiş şu an alınamadı.</p>}

      {status === 'ready' && spins.length === 0 && (
        <p className="mt-2 text-center text-[11px] text-white/60">Henüz tur oynamadın.</p>
      )}

      {status === 'ready' && spins.length > 0 && (
        <ul className="mt-2 space-y-1">
          {spins.slice(0, VISIBLE).map((spin) => (
            <li key={spin.id} className="flex items-center gap-2 rounded-lg bg-slot-panel px-2 py-1.5">
              <span
                className={`w-20 shrink-0 font-mono text-xs font-black tabular-nums ${
                  spin.win > 0 ? 'text-slot-green' : 'text-white/50'
                }`}
              >
                {spin.win > 0 ? `+${format(spin.win)}` : `−${format(spin.cost)}`}
              </span>
              <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-white/60">
                Bahis {format(spin.bet)} · {clock(spin.at)}
                {spin.jackpot > 0 ? ' · JACKPOT' : spin.big_win ? ' · BÜYÜK ÖDÜL' : ''}
              </span>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/70">{format(spin.coins)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}