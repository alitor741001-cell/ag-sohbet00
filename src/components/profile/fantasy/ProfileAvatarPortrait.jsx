import XpAvatar from '@/components/xp/XpAvatar';
import VipAvatarFrame from '@/components/vip/VipAvatarFrame';
import useVipCosmetics from '@/hooks/useVipCosmetics';
import { useAuth } from '@/lib/AuthContext';
export default function ProfileAvatarPortrait({ avatar, name }) {
  const cosmetics = useVipCosmetics();
  const { user } = useAuth();
  const frame = cosmetics.level >= 5 ? cosmetics.groups?.find(group => group.kind==='frame')?.items.find(item => item.equipped)?.theme : null;
  return <VipAvatarFrame theme={frame}><XpAvatar avatar={avatar} name={name} size="xl" video={user?.avatar_video || ''} animated={cosmetics.items.some(item => item.kind === 'avatar' && item.active)} /></VipAvatarFrame>;
}