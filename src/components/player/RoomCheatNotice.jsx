import { Gift, Trophy } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { getRoleInfo } from '@/lib/roles';
import { HIDDEN_AVATAR_URL, isHiddenName } from '@/lib/hiddenUser';
import { LEVEL_UP_TONE } from '@/lib/levelUpNotice';

const COLORS = { flame: '#ff4500', lightning: '#3b82f6', heart: '#ec4899', diamond: '#ff1744', star: '#facc15', gold: '#fbbf24', smoke: '#4caf50', solid: '#ffffff' };

export default function RoomCheatNotice({ notice, profile = {}, isOwner = false, userId = '', onOpenProfile }) {
  // Gizli kullanıcı: gerçek isim, fotoğraf ve rol etiketi gösterilmez — yalnızca takma ad ve maskeli profil.
  const hidden = isHiddenName(notice.participant.name);
  const role = hidden ? {} : getRoleInfo(profile);
  const owner = isOwner && !hidden;
  const border = COLORS[role.msg_effect || role.name_effect] || role.color || 'hsl(var(--primary))';
  const color = COLORS[role.name_effect] || role.color || 'hsl(var(--foreground))';
  const name = hidden ? notice.participant.name : (profile.username || notice.participant.name || profile.full_name || 'Kullanıcı');
  const avatar = hidden ? HIDDEN_AVATAR_URL : (profile.avatar || notice.participant.avatar);
  // Bildirime dokununca kişinin tam profil kartı açılır.
  return (
    <button
      type="button"
      disabled={!userId || !onOpenProfile}
      onClick={() => onOpenProfile?.(userId)}
      className="flex w-full min-w-0 items-center gap-2 rounded-xl border-2 bg-card px-3 py-2 text-left text-card-foreground active:scale-[0.99] disabled:active:scale-100"
      style={{ borderColor: border, boxShadow: `inset 0 0 8px ${border}` }}
    >
      {avatar ? <Image src={avatar} className="h-8 w-8 shrink-0 rounded-full" fittingType="fill" /> : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-bold" style={{ color }}>{name[0]}</span>}
      <div className="min-w-0 text-xs">
        {(role.label || owner) && <p className="text-[10px] font-bold" style={{ color }}>{[role.label, owner ? 'Oda sahibi' : ''].filter(Boolean).join(' · ')}</p>}
        <p>{hidden ? <span className="hidden-user-name font-bold">{name}</span> : <span className="font-bold" style={{ color }}>{name}</span>} {notice.type === 'levelup' ? <>
          {/* Atış seviyesi: hediye ikonu + kehribar renk. Hediye alma seviyesi: kupa + mavi renk. */}
          {notice.levelKind === 'received'
            ? <Trophy className={`inline h-3.5 w-3.5 align-[-2px] ${LEVEL_UP_TONE.received}`} />
            : <Gift className={`inline h-3.5 w-3.5 align-[-2px] ${LEVEL_UP_TONE.sent}`} />}
          {' '}<span className={`font-black tabular-nums ${notice.levelKind === 'received' ? LEVEL_UP_TONE.received : LEVEL_UP_TONE.sent}`}>{notice.level}</span> lvl atladı
        </> : notice.type === 'join' ? 'odaya katıldı' : 'odadan ayrıldı'}</p>
      </div>
    </button>
  );
}