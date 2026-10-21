import { useMemo, useState } from 'react';
import { Crown, Loader2, X } from 'lucide-react';
import GiftBoardRow from '@/components/voice/GiftBoardRow';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useBackDismiss from '@/hooks/useBackDismiss';

const TABS = [
  { key: 'day', label: 'Günlük Sıralama' },
  { key: 'week', label: 'Haftalık Sıralama' },
  { key: 'all', label: 'Toplam' },
];

/** Zenginlik sıralaması: günlük, haftalık ve toplam hediye gönderim listeleri. */
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
      <div
        className="animate-sheet-up relative flex h-[78vh] max-h-[720px] w-full flex-col overflow-hidden rounded-t-[26px] border-t border-[#e8c874]/40 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-white shadow-[0_-12px_40px_rgba(0,0,0,0.55)]"
        style={{ background: 'linear-gradient(180deg,#1e3a8a 0%,#172d6b 45%,#101a3f 100%)' }}
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          style={{ background: 'radial-gradient(120% 100% at 50% 0%, rgba(96,165,250,0.35), transparent 72%)' }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Altın çerçeveli başlık */}
        <div className="relative mx-auto mt-4 w-[74%] max-w-[300px] shrink-0">
          <div className="rounded-[16px] p-[2px] shadow-[0_0_22px_rgba(251,191,36,0.45)]" style={{ backgroundImage: 'linear-gradient(180deg,#fdf0b8,#e3bd63 45%,#a97a2c)' }}>
            <div
              className="flex items-center justify-center gap-2 rounded-[14px] border border-[#f7e39b]/30 px-4 py-2"
              style={{ background: 'linear-gradient(180deg,#2a4bb0 0%,#16255c 100%)' }}
            >
              <Crown className="h-4 w-4 text-[#f7d97a]" fill="currentColor" strokeWidth={1.4} />
              <p className="text-[15px] font-black tracking-[0.18em] text-white" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>ZENGİNLİK</p>
              <Crown className="h-4 w-4 text-[#f7d97a]" fill="currentColor" strokeWidth={1.4} />
            </div>
          </div>
          <span className="absolute -left-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-[#e3bd63] shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
          <span className="absolute -right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-[#e3bd63] shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
        </div>

        {/* Sekmeler: günlük, haftalık, toplam */}
        <div className="mx-auto mt-3 flex w-[92%] max-w-[360px] shrink-0 items-center gap-1 rounded-full border border-sky-300/20 bg-[#0b1533]/70 p-1">
          {TABS.map((item) => {
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                aria-pressed={isActive}
                className={`flex-1 whitespace-nowrap rounded-full px-1 py-1.5 text-[10.5px] font-bold leading-tight transition ${
                  isActive ? 'text-white' : 'text-sky-200/60'
                }`}
                style={isActive
                  ? {
                      background: 'linear-gradient(180deg,#3b82f6,#0ea5e9)',
                      border: '1px solid rgba(34,211,238,0.8)',
                      boxShadow: '0 0 12px rgba(34,211,238,0.5), inset 0 1px 0 rgba(255,255,255,0.35)',
                    }
                  : { border: '1px solid transparent' }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3">
          {loading && !entries.length ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-cyan-300" /></div>
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
            <p className="py-10 text-center text-xs text-sky-100/50">
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
  );
}