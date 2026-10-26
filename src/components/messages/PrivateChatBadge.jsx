import { Bell } from 'lucide-react';

/** Özel sohbet düğmesinin üstünde beliren okunmamış mesaj bildirimi. */
export default function PrivateChatBadge({ count = 0 }) {
  if (!count) return null;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-[1px] flex -translate-x-1/2 items-center gap-[2px] rounded-full bg-[#FFD700] px-1.5 py-[1px] text-[9px] font-black leading-none text-black shadow-[0_0_10px_rgba(255,215,0,0.9)]"
    >
      <Bell className="h-2.5 w-2.5" />
      {count > 99 ? '99+' : count}
    </span>
  );
}