import { vipVars } from '@/components/vip/vipTheme';
import VipFrameArtwork from '@/components/vip/VipFrameArtwork';
export default function VipAvatarFrame({ theme, children, className = '' }) {
  if (!theme) return children;
  return <span style={vipVars(theme)} className={`relative inline-flex shrink-0 items-center justify-center ${className}`}>{children}<VipFrameArtwork theme={theme} /></span>;
}