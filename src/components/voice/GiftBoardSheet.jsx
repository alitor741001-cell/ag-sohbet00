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
      <div className="flex gap-1 rounded-xl bg-black/5 p-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${tab === item.key ? 'bg-white text-[#1F2024] shadow-sm' : 'text-[#6b7280]'}`}
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
            <div key={entry.user_id} className="flex items-center gap-2.5 rounded-xl bg-black/[0.03] px-2.5 py-2">
              <span className="w-5 shrink-0 text-center text-[11px] font-bold text-[#9ca3af]">{index + 1}</span>
              <GiftRankFrame rank={index + 1} avatar={entry.avatar} name={entry.name} />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#1F2024]">
                {entry.name}
                {entry.gifts > 1 && <span className="ml-1.5 text-[10px] font-semibold text-[#9ca3af]">{entry.gifts} hediye</span>}
              </span>
              <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold tabular-nums text-sky-700">
                {formatScore(entry.score)} 💎
              </span>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-xs text-[#9ca3af]">
            {tab === 'day' ? 'Son 24 saatte hediye gönderilmedi.' : 'Bu odada henüz hediye gönderilmedi.'}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3 text-xs">
        <span className="font-semibold text-[#6b7280]">{tab === 'day' ? 'Son 24 saat' : 'Odadaki toplam'}</span>
        <span className="font-bold tabular-nums text-[#1F2024]">{formatScore(active.total)} 💎</span>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-[#9ca3af]">24 saatlik liste, hediye gönderiminden 24 saat sonra kendiliğinden sıfırlanır.</p>
    </VoiceCard>
  );
}