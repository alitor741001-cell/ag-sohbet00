import { vipVars } from '@/components/vip/vipTheme';
export default function VipAvatarFrame({ theme, children, className = '' }) {
  if (!theme) return children;
  return <span style={vipVars(theme)} data-vip-shape={theme.shape} className={`vip-avatar-frame inline-flex shrink-0 items-center justify-center ${className}`}>{children}</span>;
}