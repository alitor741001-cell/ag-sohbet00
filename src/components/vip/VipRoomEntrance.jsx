import { X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import useVipEntries from '@/components/vip/useVipEntries';
import { vipVars } from '@/components/vip/vipTheme';
export default function VipRoomEntrance({ roomId, participants }) {
  const { person, profile, theme, dismiss } = useVipEntries(roomId, participants);
  if (!person || !theme || !profile) return null;
  return <aside key={person.entryKey} style={vipVars(theme)} className="vip-world vip-glass vip-entry fixed inset-x-4 top-[max(5rem,env(safe-area-inset-top))] z-[260] mx-auto flex max-w-sm items-center gap-3 overflow-hidden rounded-2xl p-4" aria-live="polite">
    <Image src={theme.image} alt="" className="absolute inset-0 h-full w-full opacity-25" />
    <Image src={profile.avatar || person.avatar || theme.image} alt="" className="relative h-14 w-14 shrink-0 rounded-full" />
    <div className="relative min-w-0 flex-1"><p className="vip-gold text-xs font-black">VIP {profile.vip_level} · {theme.name}</p><p className="mt-1 truncate text-sm font-bold">{profile.username || profile.full_name || person.name}</p><p className="text-[10px]">Odaya katıldı</p></div>
    <button type="button" aria-label="Giriş efektini kapat" onClick={dismiss} className="relative self-start p-1"><X className="h-4 w-4" /></button>
  </aside>;
}