import { Image } from '@/components/ui/image';
import { vipVars } from '@/components/vip/vipTheme';
export default function VipBadge({ theme }) {
  if (!theme) return null;
  return <span style={vipVars(theme)} className="vip-badge inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-black" title={theme.name}>
    <Image src={theme.image} alt="" className="h-5 w-5 rounded-full" />VIP {theme.level}
  </span>;
}