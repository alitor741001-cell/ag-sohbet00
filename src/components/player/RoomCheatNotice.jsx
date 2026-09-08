import { Image } from '@/components/ui/image';
import { getRoleInfo } from '@/lib/roles';

const COLORS = { flame: '#ff4500', lightning: '#3b82f6', heart: '#ec4899', diamond: '#ff1744', star: '#facc15', gold: '#fbbf24', smoke: '#4caf50', solid: '#ffffff' };

export default function RoomCheatNotice({ notice, profile = {}, isOwner = false }) {
  const role = getRoleInfo(profile);
  const border = COLORS[role.msg_effect || role.name_effect] || role.color || 'hsl(var(--primary))';
  const color = COLORS[role.name_effect] || role.color || 'hsl(var(--foreground))';
  const name = profile.username || notice.participant.name || profile.full_name || 'Kullanıcı';
  const avatar = profile.avatar || notice.participant.avatar;
  return (
    <div className="flex w-full min-w-0 items-center gap-2 rounded-xl border-2 bg-card px-3 py-2 text-card-foreground" style={{ borderColor: border, boxShadow: `inset 0 0 8px ${border}` }}>
      {avatar ? <Image src={avatar} className="h-8 w-8 shrink-0 rounded-full" fittingType="fill" /> : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-bold" style={{ color }}>{name[0]}</span>}
      <div className="min-w-0 text-xs">
        {(role.label || isOwner) && <p className="text-[10px] font-bold" style={{ color }}>{[role.label, isOwner ? 'Oda sahibi' : ''].filter(Boolean).join(' · ')}</p>}
        <p><span className="font-bold" style={{ color }}>{name}</span> {notice.type === 'join' ? 'odaya katıldı' : 'odadan ayrıldı'}</p>
      </div>
    </div>
  );
}