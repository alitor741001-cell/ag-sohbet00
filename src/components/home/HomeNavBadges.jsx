import { useCurrentUser } from '@/lib/useCurrentUser';
import useSupportBadge from '@/hooks/useSupportBadge';
import { useMessageRealtime } from '@/components/messages/MessageRealtimeProvider';

// Alt menüdeki "Sohbet" ve "Canlı Destek" düğmelerinin üstünde okunmamış sayısı.
const MARKS = [
  { key: 'chat', x: 31.75, label: 'Okunmamış sohbet mesajı' },
  { key: 'support', x: 69.25, label: 'Okunmamış canlı destek mesajı' },
];

export default function HomeNavBadges() {
  const { user } = useCurrentUser();
  const support = useSupportBadge(user?.id);
  const { badges } = useMessageRealtime();
  const counts = { chat: badges?.messages || 0, support: support || 0 };

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {MARKS.map(({ key, x, label }) => {
        const count = counts[key];
        if (!count) return null;
        return (
          <span
            key={key}
            role="status"
            aria-label={label}
            className="absolute flex h-5 min-w-5 -translate-x-1/2 items-center justify-center rounded-full bg-[#ef4343] px-1 text-[11px] font-bold leading-none text-white ring-2 ring-black/70"
            style={{ left: `${x}%`, top: '88.2%', boxShadow: '0 0 10px rgba(239,67,67,0.9)' }}
          >
            {count > 99 ? '99+' : count}
          </span>
        );
      })}
    </div>
  );
}