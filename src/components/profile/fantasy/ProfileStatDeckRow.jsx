import { Eye, HeartHandshake, UserCheck, Users } from 'lucide-react';

// Dört sosyal sayaç: arkadaşlar, takip edilenler, takipçiler, ziyaretçiler.
const ITEMS = [
  { key: 'friends', label: 'Arkadaşlar', Icon: Users },
  { key: 'following', label: 'Takip Edilenler', Icon: UserCheck },
  { key: 'followers', label: 'Takipçiler', Icon: HeartHandshake },
  { key: 'visitors', label: 'Ziyaretçiler', Icon: Eye },
];

const count = (value) => (value === null || value === undefined
  ? ''
  : Number(value).toLocaleString('tr-TR'));

/**
 * Profil menüsünün en üst satırı: tasarımdaki mavi panelin yerine geçen koyu şerit.
 * Dört bölge de aynı görünür, sayılar canlı değerlerden yazılır ve listeden açılır.
 */
export default function ProfileStatDeckRow({ stats = {}, onAction }) {
  return (
    <div className="absolute" style={{ left: '4.5%', width: '91%', top: 0, height: '17%' }}>
      <div className="grid h-full w-full grid-cols-4 overflow-hidden rounded-[10px] border border-premium-gold/25 bg-[linear-gradient(180deg,rgba(16,18,28,0.97),rgba(8,9,16,0.99))] shadow-[inset_0_1px_0_rgba(255,214,120,0.16),0_8px_20px_-14px_rgba(0,0,0,0.95)]">
        {ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onAction?.(key)}
            aria-label={label}
            className="flex min-w-0 flex-col items-center justify-center gap-[2px] border-l border-white/10 px-0.5 transition-colors first:border-l-0 active:bg-white/10"
          >
            <Icon className="h-[13px] w-[13px] shrink-0 text-[#f2ce6b]/70" />
            <span className="max-w-full truncate font-bold text-white/55" style={{ fontSize: 10 }}>
              {label}
            </span>
            <span className="font-extrabold tabular-nums text-white" style={{ fontSize: 13 }}>
              {count(stats[key])}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}