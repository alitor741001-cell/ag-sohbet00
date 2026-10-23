import { useEffect, useState } from 'react';
import { ChevronRight, Mic2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import InviteDetailSheet from '@/components/agency/InviteDetailSheet';
import { AGENCY_GOLD, agencyApi } from '@/lib/agency';
import { useCurrentUser } from '@/lib/useCurrentUser';

const STATUS_TEXT = {
  accepted: 'Davet kabul edildi ✓',
  rejected: 'Davet reddedildi',
  cancelled: 'Davet iptal edildi',
};

/** Sohbet listesinde yayıncı davetini açıklayıcı bir kart olarak gösterir. */
export default function AgencyInviteCard({ inviteId }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const { user } = useCurrentUser();

  useEffect(() => {
    if (!inviteId) return;
    agencyApi('invite-detail', { invite_id: inviteId })
      .then((result) => setData(result))
      .catch(() => setData(null));
  }, [inviteId]);

  const invite = data?.invite;
  const pending = !invite || invite.status === 'pending';
  // Daveti gönderen kişi (ajans sahibi/asistan) katıl/onay ekranını açamaz; kart onda bilgi olarak durur.
  const isInvitee = !invite || invite.invitee_id === user?.id;

  return (
    <>
      <button
        onClick={() => pending && isInvitee && setOpen(true)}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${pending ? 'border-[#F5C542]/50 bg-gradient-to-br from-[#221806] to-[#0d0b16]' : 'border-white/12 bg-white/5'}`}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#F5C542]/40 bg-black/50">
          {invite?.agency_logo
            ? <Image src={invite.agency_logo} className="h-full w-full object-cover" fittingType="fill" />
            : <Mic2 className="h-5 w-5" style={{ color: AGENCY_GOLD }} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-wider" style={{ color: AGENCY_GOLD }}>{invite?.kind === 'assistant' ? '🤝 Asistanlık Daveti' : '🎤 Yayıncı Daveti'}</span>
          <span className="mt-0.5 block truncate text-sm font-bold text-white">{invite?.agency_name || 'Ajans daveti'}</span>
          <span className="block truncate text-[11px] text-white/50">
            {!invite
              ? 'Davet detayları yükleniyor...'
              : isInvitee
                ? `${invite.agency_code} • ${invite.owner_name} seni ${invite.kind === 'assistant' ? 'asistan' : 'yayıncı'} olarak davet etti`
                : `${invite.agency_code} • ${invite.invitee_name || 'Kullanıcı'} kişisini ${invite.kind === 'assistant' ? 'asistan' : 'yayıncı'} olarak davet ettin`}
          </span>
          {!pending && <span className="mt-0.5 block text-[10px] text-white/40">{STATUS_TEXT[invite?.status]}</span>}
        </span>
        {pending && isInvitee && <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />}
      </button>
      <InviteDetailSheet open={open} inviteId={inviteId} onClose={() => setOpen(false)} onAnswered={() => { setOpen(false); setData((current) => (current?.invite ? { ...current, invite: { ...current.invite, status: 'accepted' } } : current)); }} />
    </>
  );
}