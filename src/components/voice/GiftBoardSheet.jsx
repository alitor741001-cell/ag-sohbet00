import { useMemo, useState } from 'react';
import { Crown, Loader2, X } from 'lucide-react';
import GiftBoardRow from '@/components/voice/GiftBoardRow';
import GiftBoardFlames from '@/components/voice/GiftBoardFlames';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useBackDismiss from '@/hooks/useBackDismiss';

const TABS = [
  { key: 'day', label: 'Günlük Sıralama' },
  { key: 'week', label: 'Haftalık Sıralama' },
  { key: 'all', label: 'Toplam' },
];

// Panel kenarını saran alev şeridi.
const FLAME_EDGE = 'linear-gradient(90deg,#7f1d1d 0%,#ea580c 16%,#fbbf24 32%,#f97316 50%,#dc2626 68%,#f59e0b 84%,#7f1d1d 100%)';

/** Zenginlik sıralaması: günlük, haftalık ve toplam hediye gönderim listeleri (alev temalı). */
export default function GiftBoardSheet({ open, onClose, board, loading }) {
  const [tab, setTab] = useState('all');
  useBackDismiss(open, onClose);

  const active = board?.[tab] || { total: 0, entries: [] };
  const entries = useMemo(() => (Array.isArray(active.entries) ? active.entries : []), [active.entries]);

  // Satırlardaki seviye/VIP rozetleri için kişi bilgileri.
  const userIds = useMemo(() => entries.map((entry) => entry.user_id).filter(Boolean), [entries]);
  const profiles = useMessageProfiles(userIds);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[260] flex items-end bg-black/70 backdrop-blur-[2px]" onClick={onClose} role="presentation">
      <div className="animate-sheet-up relative w-full" onClick={(event) => event.stopPropagation()} role="presentation">
        {/* Alevli çerçeve: kenarlar boyunca akan ateş şeridi. */}
        <div
          className="relative w-full rounded-t-[28px] p-[2px] shadow-[0_-10px_46px_rgba(249,115,22,0.5)]"
          style={{ backgroundImage: FLAME_EDGE, backgroundSize: '200% 100%', animation: 'wealth-flame-border 5s linear infinite' }}
        >
          <div
            className="relative flex h-[78vh] max-h-[720px] w-full flex-col overflow-hidden rounded-t-[26px] pb-[max(0.5rem,env(safe-area-inset-bottom))] text-white"
            style={{ background: 'radial-gradient(120% 85% at 50% 100%, #6b1a09 0%, #3d0f08 34%, #1d0a0c 70%, #120609 100%)' }}
          >
            <GiftBoardFlames />

            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-orange-300/30 bg-orange-950/60 text-orange-100/85 active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Alevli başlık çerçevesi */}
            <div className="relative z-10 mx-auto mt-4 w-[74%] max-w-[300px] shrink-0">
              <div className="rounded-[16px] p-[2px] shadow-[0_0_26px_rgba(249,115,22,0.65)]" style={{ backgroundImage: 'linear-gradient(180deg,#ffd9a1,#f97316 45%,#b91c1c)' }}>
                <div
                  className="flex items-center justify-center gap-2 rounded-[14px] border border-[#ffb26b]/35 px-4 py-2"
                  style={{ background: 'linear-gradient(180deg,#5b1508 0%,#2a0a06 100%)' }}
                >
                  <Crown className="h-4 w-4 text-[#ffb347]" fill="currentColor" strokeWidth={1.4} />
                  <p
                    className="text-[15px] font-black tracking-[0.18em] text-white"
                    style={{ textShadow: '0 0 12px rgba(255,102,0,0.9), 0 1px 6px rgba(0,0,0,0.7)' }}
                  >
                    ZENGİNLİK
                  </p>
                  <Crown className="h-4 w-4 text-[#ffb347]" fill="currentColor" strokeWidth={1.4} />
                </div>
              </div>
              <span className="absolute -left-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-[#f97316] shadow-[0_0_10px_rgba(249,115,22,0.9)]" />
              <span className="absolute -right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-[#f97316] shadow-[0_0_10px_rgba(249,115,22,0.9)]" />
            </div>

            {/* Sekmeler: günlük, haftalık, toplam — seçili sekme alevlenir */}
            <div className="relative z-10 mx-auto mt-3 flex w-[92%] max-w-[360px] shrink-0 items-center gap-1 rounded-full border border-orange-400/30 bg-[#1c0a06]/80 p-1">
              {TABS.map((item) => {
                const isActive = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    aria-pressed={isActive}
                    className={`flex-1 whitespace-nowrap rounded-full px-1 py-1.5 text-[10.5px] font-bold leading-tight transition active:scale-95 ${
                      isActive ? 'text-white' : 'text-orange-100/55 active:text-orange-50'
                    }`}
                    style={isActive
                      ? {
                          background: 'linear-gradient(180deg,#fbbf24,#f97316 45%,#dc2626)',
                          border: '1px solid rgba(255,196,120,0.9)',
                          boxShadow: '0 0 16px rgba(249,115,22,0.85), inset 0 1px 0 rgba(255,255,255,0.45)',
                          textShadow: '0 0 8px rgba(120,20,0,0.85)',
                          animation: 'wealth-flame-glow 1.8s ease-in-out infinite',
                        }
                      : { border: '1px solid transparent' }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="relative z-10 mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3">
              {loading && !entries.length ? (
                <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-orange-300" /></div>
              ) : entries.length ? (
                entries.map((entry, index) => (
                  <GiftBoardRow
                    key={entry.user_id}
                    rank={index + 1}
                    entry={entry}
                    profile={profiles[entry.user_id]}
                  />
                ))
              ) : (
                <p className="py-10 text-center text-xs text-orange-100/55">
                  {tab === 'day'
                    ? 'Bugün hediye gönderilmedi.'
                    : tab === 'week'
                      ? 'Bu hafta hediye gönderilmedi.'
                      : 'Bu odada henüz hediye gönderilmedi.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}