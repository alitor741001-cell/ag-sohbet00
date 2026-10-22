import { vipVars } from '@/components/vip/vipTheme';
export default function VipChatBubble({ theme, children }) {
  if (!theme) return children;
  return <div className="vip-bubble mt-1 min-w-0 break-words" data-vip-shape={theme.shape} style={vipVars(theme)}>{children}</div>;
}