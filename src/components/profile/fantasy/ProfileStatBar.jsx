const COLUMNS = [
  { key: 'friends', label: 'Arkadaşlar' },
  { key: 'following', label: 'Takip Edilenler' },
  { key: 'followers', label: 'Takipçiler' },
  { key: 'visitors', label: 'Ziyaretçiler' },
];

export default function ProfileStatBar({ friends = 0, following = 0, followers = 0, visitors = 0, onSelect }) {
  const values = { friends, following, followers, visitors };
  return (
    <div className="rounded-2xl p-[1px]" style={{ background: 'linear-gradient(135deg, rgba(242,206,107,0.85), rgba(148,74,196,0.35) 45%, rgba(242,206,107,0.7))' }}>
      <div className="grid grid-cols-4 rounded-2xl px-2 py-3" style={{ background: 'linear-gradient(180deg, rgba(48,18,64,0.94), rgba(24,8,36,0.94))' }}>
        {COLUMNS.map((column, index) => (
          <button key={column.key} type="button" onClick={() => onSelect?.(column.key)} className="flex flex-col items-center gap-1 active:scale-95" style={index > 0 ? { borderLeft: '1px solid rgba(125,211,252,0.18)' } : undefined}>
            <span className="text-[10.5px] font-semibold leading-tight text-white/80">{column.label}</span>
            <span className="text-lg font-extrabold leading-none tabular-nums text-white">{values[column.key] ?? '—'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}