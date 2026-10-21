import { MicOff } from 'lucide-react';
import ProfileFrame from '@/components/ProfileFrame';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { HIDDEN_AVATAR_URL, isHiddenName } from '@/lib/hiddenUser';

export default function VoiceViewerRow({ person, seat, isOwner, isMod, isSelf, onSelect }) {
  const hidden = person.hidden || isHiddenName(person.name);
  const profiles = useMessageProfiles(hidden ? [] : [person.user_id]);
  const profile = profiles[person.user_id];
  const name = hidden ? person.name || 'Gizli Kullanıcı' : profile?.username || profile?.full_name || person.name || seat?.name || 'Kullanıcı';
  const avatar = hidden ? HIDDEN_AVATAR_URL : profile?.avatar || person.avatar || seat?.avatar;
  return (
    <button type="button" onClick={() => onSelect?.(person.user_id)} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-white/5">
      <ProfileFrame avatar={avatar} name={name} size="sm" />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-bold ${hidden ? 'hidden-user-name' : 'text-fantasy-text'}`}>{name}{isSelf ? ' (Sen)' : ''}</span>
        <span className="block text-[10px] text-fantasy-gold">{isOwner ? 'Oda Sahibi' : isMod ? 'Yönetici' : seat ? 'Koltukta' : 'İzleyici'}</span>
      </span>
      {(seat?.muted || person.muted) && <MicOff className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}