const COLUMNS = [
  { key: 'friends', label: 'Arkadaşlar' },
  { key: 'following', label: 'Takip Edilenler' },
  { key: 'followers', label: 'Takipçiler' },
  { key: 'visitors', label: 'Ziyaretçiler' },
];

/** Profil istatistik şeridi: arkadaş, takip ve ziyaretçi sayıları tek parlak panelde. */
export default function ProfileStatBar({ friends = 0, following = 0, followers = 0, visitors = 0 }) {
  const values = { friends, following, followers, visitors };
  return (
    <div
      className="rounded-2xl p-[1px]"
      style={{ background: 'linear-gradient(135deg, rgba(125,211,252,0.85), rgba(37,99,235,0.25) 45%, rgba(125,211,252,0.7))' }}
    >
      <div
        className="grid grid-cols-4 rounded-2xl px-2 py-3"
        style={{ background: 'linear-gradient(180deg, rgba(11,38,80,0.92), rgba(6,22,48,0.92))' }}
      >
        {COLUMNS.map((column, index) => (
          <div key={column.key} className="flex flex-col items-center gap-1" style={index > 0 ? { borderLeft: '1px solid rgba(125,211,252,0.18)' } : undefined}>
            <span className="text-[10.5px] font-semibold leading-tight text-white/80">{column.label}</span>
            <span className="text-lg font-extrabold leading-none tabular-nums text-white">{values[column.key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}