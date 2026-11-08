import { useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import GiftBoardRow from '@/components/voice/GiftBoardRow';
import GiftBoardFlames from '@/components/voice/GiftBoardFlames';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useBackDismiss from '@/hooks/useBackDismiss';
import { ART } from '@/lib/designArt';

const TABS = [
  { key: 'day', label: '24 SAATLİK', tone: 'fire' },
  { key: 'week', label: '1 HAFTALIK', tone: 'ice' },
  { key: 'all', label: 'TOPLAM', tone: 'fire' },
];

// Sekme biçimi: altıgen enerji plakası.
const HEX = 'polygon(9% 0%, 91% 0%, 100% 50%, 91% 100%, 9% 100%, 0% 50%)';
const TONES = {
  fire: { fill: 'linear-gradient(180deg,#ffe07a,#ff8a00 46%,#c81e0a)', rgb: '255,120,0', text: '#ffd700', idle: 'rgba(255,90,0,0.14)' },
  ice: { fill: 'linear-gradient(180deg,#b8f6ff,#22c8ff 46%,#0b63c9)', rgb: '0,210,255', text: '#00ffff', idle: 'rgba(0,180,255,0.14)' },
};

/** Zenginlik sıralaması: 24 saatlik, 1 haftalık ve toplam hediye gönderim listeleri.
    Alttan yukarı açılır, yanları ve altı tamamen kaplar; zeminini tema görseli
    kesintisiz doldurur (kart içinde kart yoktur). */
export default function GiftBoardSheet({ open, onClose, board, loading, onSelect }) {
  const [tab, setTab] = useState('all');
  useBackDismiss(open, onClose);

  const active = board?.[tab] || { total: 0, entries: [] };
  const entries = useMemo(() => (Array.isArray(active.entries) ? active.entries : []), [active.entries]);

  // Satırlardaki seviye/VIP rozetleri için kişi bilgileri.
  const userIds = useMemo(() => entries.map((entry) => entry.user_id).filter(Boolean), [entries]);
  const profiles = useMessageProfiles(userIds);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[260] bg-black/75 backdrop-blur-[2px]" onClick={onClose} role="presentation">
      <div
        className="absolute inset-x-0 bottom-0 animate-sheet-up"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        <div
          className="relative flex h-[86dvh] max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-[26px] text-white shadow-[0_-14px_54px_rgba(0,0,0,0.8)] ring-1 ring-white/15"
          style={{
            backgroundColor: '#050912',
            paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))',
          }}
        >
          <img
            src={ART.pageBg}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/30" aria-hidden="true" />
          <GiftBoardFlames />

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/70 text-white/80 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Sekmeler: 24 saatlik, 1 haftalık, toplam — ateş ve buz plakaları */}
          <div className="relative z-10 mx-auto mt-4 flex w-[92%] shrink-0 items-center gap-1.5">
            {TABS.map((item) => {
              const isActive = tab === item.key;
              const tone = TONES[item.tone];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  aria-pressed={isActive}
                  className="relative flex-1 whitespace-nowrap py-2 text-[10.5px] font-black leading-tight tracking-[0.06em] transition active:scale-95"
                  style={{
                    clipPath: HEX,
                    background: isActive ? tone.fill : tone.idle,
                    color: isActive ? '#ffffff' : tone.text,
                    textShadow: `0 0 10px rgba(${tone.rgb},0.95)`,
                    boxShadow: isActive ? `inset 0 0 0 1px rgba(${tone.rgb},0.95), 0 0 18px rgba(${tone.rgb},0.85)` : `inset 0 0 0 1px rgba(${tone.rgb},0.75)`,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="relative z-10 mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3">
            {loading && !entries.length ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-cyan-300" /></div>
            ) : entries.length ? (
              entries.map((entry, index) => (
                <GiftBoardRow
                  key={entry.user_id}
                  rank={index + 1}
                  entry={entry}
                  profile={profiles[entry.user_id]}
                  onSelect={(id) => { onClose(); onSelect?.(id); }}
                />
              ))
            ) : (
              <p className="py-10 text-center text-xs text-white/55">
                {tab === 'day'
                  ? 'Son 24 saatte hediye gönderilmedi.'
                  : tab === 'week'
                    ? 'Bu hafta hediye gönderilmedi.'
                    : 'Bu odada henüz hediye gönderilmedi.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}