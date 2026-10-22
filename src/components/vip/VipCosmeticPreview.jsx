import { Sparkles, UserRound } from 'lucide-react';
import VipAvatarFrame from '@/components/vip/VipAvatarFrame';
import { Image } from '@/components/ui/image';
import { vipVars } from '@/components/vip/vipTheme';
import XpAvatar from '@/components/xp/XpAvatar';
export default function VipCosmeticPreview({ kind, theme, avatar = '', name = 'AG SOHBET' }) {
  const portrait = avatar ? <Image src={avatar} alt={name} className="h-full w-full rounded-full" /> : <UserRound className="h-7 w-7" />;
  return <div style={vipVars(theme)} className="vip-tint flex h-24 w-full items-center justify-center overflow-hidden" data-vip-shape={theme.shape}>
    {kind === 'badge' && <div className="vip-badge flex items-center gap-1 rounded-lg px-2 py-1 font-black"><Image src={theme.image} alt="" className="h-9 w-9 rounded-full" /><span>VIP {theme.level}</span></div>}
    {kind === 'frame' && <VipAvatarFrame theme={theme} className="h-12 w-12"><span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">{portrait}</span></VipAvatarFrame>}
    {kind === 'avatar' && <XpAvatar avatar={avatar || theme.image} name={name} size="md" animated />}
    {kind === 'mic' && <div className="vip-wave relative flex h-11 w-11 items-center justify-center rounded-full" data-vip-shape={theme.shape}><span className="text-xl">✦</span></div>}
    {kind === 'bubble' && <div className="vip-bubble max-w-full text-[10px]" data-vip-shape={theme.shape}>Merhaba, hoş geldin!</div>}
    {kind === 'card' && <div className="vip-badge relative flex h-20 w-full max-w-32 items-end overflow-hidden rounded-xl p-2"><Image src={theme.image} alt="" className="absolute inset-0 h-full w-full opacity-40" /><span className="relative text-[10px] font-bold">{name}<br />VIP {theme.level}</span></div>}
    {kind === 'banner' && <div className="vip-badge flex w-full items-center gap-1 rounded-r-full p-2"><Image src={theme.image} alt="" className="h-9 w-9 rounded-full" /><span className="text-[9px] font-bold">VIP {theme.level}<br />{name} odaya katıldı</span></div>}
    {kind === 'name' && <span className={theme.nameAnimated ? 'vip-name-animated text-sm font-black' : 'text-sm font-black'}>{name}</span>}
    {!['badge','frame','mic','bubble','card','banner','name','avatar'].includes(kind) && <Sparkles className="h-8 w-8 opacity-40" />}
  </div>;
}