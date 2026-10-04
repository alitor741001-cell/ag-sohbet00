import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import VoiceCard from '@/components/voice/VoiceCard';
import GiftRankFrame from '@/components/voice/GiftRankFrame';
import RoomLevelBadge from '@/components/levels/RoomLevelBadge';
import RoleBadge from '@/components/RoleBadge';
import { Image } from '@/components/ui/image';
import useRoomLevels from '@/hooks/useRoomLevels';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { formatScore } from '@/components/voice/scoreTier';

const TABS = [
  { key: 'day', label: '24 saat' },
  { key: 'all', label: 'Toplam' },
];

const PILL_BG = '#f3eaf5';
const TOTAL_COLOR = '#e91e63';

/** Hediye sıralaması: son 24 saatlik gönderimler ve odadaki toplam. */
export default function GiftBoardSheet({ open, onClose, board, loading }) {
  const [tab, setTab] = useState('all');
  const active = (tab === 'day' ? board?.day : board?.all) || { total: 0, entries: [] };
  const entries = useMemo(() => (Array.isArray(active.entries) ? active.entries : []), [active.entries]);

  // Satırlardaki seviye ve rol rozetleri için kişi bilgileri.
  const userIds = useMemo(() => entries.map((entry) => entry.user_id).filter(Boolean), [entries]);
  const { levels } = useRoomLevels(userIds);
  const profiles = useMessageProfiles(userIds);

  return (
    <VoiceCard open={open} title="Hediye Sıralaması" onClose={onClose}>
      <div className="mx-auto flex w-fit gap-1 rounded-full p-1" style={{ backgroundColor: '#efeff1' }}>
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-full px-5 py-1.5 text-xs font-semibold transition-all ${tab === item.key ? 'bg-white text-[#1F2024] shadow-sm' : 'text-[#6b7280]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-2 max-h-[52vh] overflow-y-auto">
        {loading && !entries.length ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : entries.length ? (
          entries.map((entry, index) => {
            const rank = index + 1;
            const profile = profiles[entry.user_id];
            return (
              <div key={entry.user_id} className="flex items-center gap-2.5 border-b border-black/5 py-2 last:border-b-0">
                <span className="w-5 shrink-0 text-center text-[13px] font-bold text-[#6b7280]">{rank}</span>

                {rank <= 3 ? (
                  <GiftRankFrame rank={rank} avatar={entry.avatar} name={entry.name} />
                ) : (
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-black/10 bg-black/5">
                    {entry.avatar
                      ? <Image src={entry.avatar} alt={entry.name} className="h-full w-full" fittingType="fill" draggable={false} />
                      : <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[#6b7280]">{(entry.name || '?').trim().charAt(0)}</span>}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#1F2024]">{entry.name}</p>
                  <div className="mt-0.5 flex items-center gap-1 overflow-hidden">
                    <RoomLevelBadge level={levels[entry.user_id]} />
                    <RoleBadge user={profile} size="sm" />
                    <span className="shrink-0 rounded bg-black/5 px-1 text-[9px] font-bold text-[#6b7280]">
                      #{profile?.member_id || entry.user_id?.slice(-4) || '—'}
                    </span>
                  </div>
                </div>

                <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums text-[#5b2a63]" style={{ backgroundColor: PILL_BG }}>
                  {formatScore(entry.score)} 💎
                </span>
              </div>
            );
          })
        ) : (
          <p className="py-8 text-center text-xs text-[#9ca3af]">
            {tab === 'day' ? 'Son 24 saatte hediye gönderilmedi.' : 'Bu odada henüz hediye gönderilmedi.'}
          </p>
        )}
      </div>

      <div className="mt-2 border-t border-black/10 pt-3 text-center">
        <span className="text-xs font-semibold text-[#6b7280]">Odadaki toplam: </span>
        <span className="text-base font-black tabular-nums" style={{ color: TOTAL_COLOR }}>{formatScore(active.total)} 💎</span>
      </div>
    </VoiceCard>
  );
}