import { Eye, UserCheck, UserPlus, Users } from 'lucide-react';
import NeonPanel from '@/components/profile/neon/NeonPanel';

const COLUMNS = [
  { key: 'friends', label: 'Arkadaşlar', icon: Users },
  { key: 'following', label: 'Takip Edilenler', icon: UserPlus },
  { key: 'followers', label: 'Takipçiler', icon: UserCheck },
  { key: 'visitors', label: 'Ziyaretçiler', icon: Eye },
];

/** İstatistik şeridi: her sütun ilgili listeyi açar. */
export default function NeonStats({ friends = 0, following = 0, followers = 0, visitors = 0, onSelect }) {
  const values = { friends, following, followers, visitors };
  return (
    <NeonPanel innerClassName="grid grid-cols-4 px-1 py-3">
      {COLUMNS.map((column, index) => (
        <button
          key={column.key}
          type="button"
          onClick={() => onSelect?.(column.key)}
          className="flex min-w-0 flex-col items-center gap-1 active:scale-95"
          style={index > 0 ? { borderLeft: '1px solid rgba(125,211,252,0.16)' } : undefined}
        >
          <column.icon className="h-3.5 w-3.5 text-[#9fd8ff]" aria-hidden="true" />
          <span className="px-0.5 text-center text-[9.5px] font-semibold leading-tight text-[#9fd8ff]">{column.label}</span>
          <span className="text-[17px] font-black leading-none tabular-nums text-white">{values[column.key]}</span>
        </button>
      ))}
    </NeonPanel>
  );
}