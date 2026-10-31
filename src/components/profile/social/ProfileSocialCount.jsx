export default function ProfileSocialCount({ value, unread = 0 }) {
  return <>
    {value !== undefined && <span className="pointer-events-none absolute inset-x-0 bottom-0 text-center text-sm font-bold tabular-nums text-fantasy-text">{value === null ? '…' : value.toLocaleString('tr-TR')}</span>}
    {unread > 0 && <span aria-label={`${unread} yeni ziyaretçi`} className="absolute right-1 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">{unread > 99 ? '99+' : unread}</span>}
  </>;
}