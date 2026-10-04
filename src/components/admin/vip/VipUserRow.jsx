import { useState } from 'react';
import { Image } from '@/components/ui/image';
import UserStatusBadges from '@/components/status/UserStatusBadges';

// VIP Merkezi'nden verilebilen seviyeler: 0 = VIP kaldır.
const LEVELS = [0, 5, 6, 7, 8, 9, 10, 11, 12];
// VIP süreleri: 1 hafta, 15 gün, 1 ay.
const DURATIONS = [
  { key: 'week', label: '1 Hafta' },
  { key: 'half', label: '15 Gün' },
  { key: 'month', label: '1 Ay' },
];

/** VIP Merkezi satırı: kişi bilgisi, rozetleri, süre seçimi ve seviye düğmeleri. */
export default function VipUserRow({ person, busy, onSet }) {
  const [duration, setDuration] = useState('month');
  const active = (person.vip_level || 0) > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2.5">
        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
          {person.avatar ? (
            <Image src={person.avatar} alt={person.name} className="h-full w-full" fittingType="fill" draggable={false} />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white/70">
              {String(person.name || '?').trim().charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{person.name}</p>
          <p className="truncate text-[10px] text-white/45">Kimlik: {person.member_id || '—'}</p>
          {active && (
            <p className="truncate text-[10px] font-semibold text-amber-300">
              {person.vip_days_left > 0 ? `Kalan: ${person.vip_days_left} gün` : 'Süresiz VIP'}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2">
        <UserStatusBadges
          n_level={person.n_level || 0}
          vip_level={person.vip_level || 0}
          vip_days_left={person.vip_days_left || 0}
          gift_sent_level={person.gift_sent_level || 0}
          gift_sent_tier={person.gift_sent_tier || 'green'}
          gift_received_level={person.gift_received_level || 0}
          gift_received_tier={person.gift_received_tier || 'green'}
          className="!justify-start"
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold text-white/45">Süre:</span>
        {DURATIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setDuration(item.key)}
            className={item.key === duration
              ? 'rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-black'
              : 'rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/70'}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            disabled={busy}
            onClick={() => onSet(person.user_id, level, duration)}
            className={level === (person.vip_level || 0)
              ? 'rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-black disabled:opacity-50'
              : 'rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-50'}
          >
            {level === 0 ? 'Kaldır' : `VIP${level}`}
          </button>
        ))}
      </div>
    </div>
  );
}