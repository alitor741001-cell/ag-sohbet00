import { XCircle } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useUserProfile } from '@/lib/profileCard';

export default function SupportMemberIdentity({ ticket, onCloseTopic }) {
  const { openUserProfile, closeUserProfile } = useUserProfile();
  const open = () => openUserProfile(ticket.user_id, {
    name: ticket.user_name, avatar: ticket.user_avatar,
    roomActions: { kind: 'support' },
    info: [{ label: 'Destek konusu', value: ticket.subject }],
    footer: [{ key: 'close-support', label: 'Görüşmeyi sonlandır', icon: XCircle, danger: true,
      onClick: async () => { if (await onCloseTopic()) closeUserProfile(); } }],
  });
  return <button type="button" onClick={open} disabled={ticket.user_id?.startsWith('guest:')} className="flex min-w-0 items-center gap-2 text-left" aria-label={`${ticket.user_name || 'Üye'} profilini aç`}>
    {ticket.user_avatar ? <Image src={ticket.user_avatar} alt="" className="h-10 w-10 shrink-0 rounded-full" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">{(ticket.user_name || 'Ü')[0]}</span>}
    <span className="min-w-0"><span className="block truncate font-bold text-primary">{ticket.user_name || 'Kullanıcı'}</span><span className="block text-xs text-muted-foreground">Üye · ID: {ticket.member_id || '—'}</span></span>
  </button>;
}