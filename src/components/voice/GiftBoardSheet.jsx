import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import VoiceCard from '@/components/voice/VoiceCard';
import GiftRankFrame from '@/components/voice/GiftRankFrame';
import { formatScore } from '@/components/voice/scoreTier';

const TABS = [
  { key: 'day', label: '24 saat' },
  { key: 'all', label: 'Toplam' },
];

/** Hediye sıralaması: son 24 saatlik gönderimler ve tüm zamanların toplamı. */
export default function GiftBoardSheet({ open, onClose, board, loading }) {
  const [tab, setTab] = useState('day');
  const active = (tab === 'day' ? board?.day : board?.all) || { total: 0, entries: [] };
  const entries = Array.isArray(active.entries) ? active.entries : [];

  return (
    <VoiceCard open={open} title="Hediye Sıralaması" onClose={onClose}>
      <div className="flex gap-1 rounded-xl bg-white/5 p-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${tab === item.key ? 'bg-white/15 text-white' : 'text-white/55'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-3 max-h-[52vh] space-y-1.5 overflow-y-auto">
        {loading && !entries.length ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : entries.length ? (
          entries.map((entry, index) => (
            <div key={entry.user_id} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-2.5 py-2">
              <span className="w-5 shrink-0 text-center text-[11px] font-bold text-white/45">{index + 1}</span>
              <GiftRankFrame rank={index + 1} avatar={entry.avatar} name={entry.name} />
              <span className="min-w-0 flex-1 truncate text-sm font-bold">
                {entry.name}
                {entry.gifts > 1 && <span className="ml-1.5 text-[10px] font-semibold text-white/45">{entry.gifts} hediye</span>}
              </span>
              <span className="shrink-0 rounded-full bg-sky-400/15 px-2 py-0.5 text-xs font-bold tabular-nums text-sky-200">
                {formatScore(entry.score)} 💎
              </span>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-xs text-white/50">
            {tab === 'day' ? 'Son 24 saatte hediye gönderilmedi.' : 'Bu odada henüz hediye gönderilmedi.'}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
        <span className="font-semibold text-white/55">{tab === 'day' ? 'Son 24 saat' : 'Odadaki toplam'}</span>
        <span className="font-bold tabular-nums text-white">{formatScore(active.total)} 💎</span>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-white/40">24 saatlik liste, hediye gönderiminden 24 saat sonra kendiliğinden sıfırlanır.</p>
    </VoiceCard>
  );
}