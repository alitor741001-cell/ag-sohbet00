import { useEffect, useState } from 'react';
import { ChevronRight, Loader2, MailOpen, Mic2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { AGENCY_GOLD, agencyApi, dateText } from '@/lib/agency';

/** Davetlerim: gelen ve gönderilen yayıncı davetleri. */
export default function AgencyInvitesPanel({ open = true, compact = false, onOpenInvite, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    agencyApi('invites')
      .then((result) => setData(result))
      .catch(() => setData({ received: [], sent: [] }))
      .finally(() => setLoading(false));
  }, [open, refreshKey]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" style={{ color: AGENCY_GOLD }} /></div>;
  }

  const received = data?.received || [];
  const pendingReceived = received.filter((invite) => invite.status === 'pending');
  const pendingSent = (data?.sent || []).filter((invite) => invite.status === 'pending');

  if (!compact && pendingReceived.length === 0 && pendingSent.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 py-10 text-center">
        <MailOpen className="mx-auto h-6 w-6 text-white/30" />
        <p className="mt-2 text-sm font-semibold text-white/60">Davet yok</p>
        <p className="text-[11px] text-white/40">Ajans davetleri burada görünür.</p>
      </div>
    );
  }

  const row = (invite, isIncoming) => (
    <button
      key={invite.id}
      onClick={() => isIncoming && invite.status === 'pending' && onOpenInvite?.(invite.id)}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left active:scale-[0.99] ${invite.status === 'pending' && isIncoming ? 'border-[#F5C542]/45 bg-gradient-to-br from-[#221806] to-[#0b0910]' : 'border-white/10 bg-white/5'}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black/50">
        {invite.agency_logo
          ? <Image src={invite.agency_logo} className="h-full w-full object-cover" fittingType="fill" />
          : <Mic2 className="h-4 w-4" style={{ color: AGENCY_GOLD }} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">{invite.agency_name}</span>
        <span className="block truncate text-[11px] text-white/45">
          {invite.agency_code} • {isIncoming ? `${invite.owner_name} davet etti` : invite.invitee_name}
        </span>
        <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${
          invite.status === 'pending' ? 'border-[#F5C542]/45 text-[#F5C542]'
            : invite.status === 'accepted' ? 'border-[#4ade80]/45 text-[#4ade80]'
              : 'border-white/20 text-white/45'}`}
        >
          {invite.status === 'pending' ? 'Onay bekliyor' : invite.status === 'accepted' ? 'Katıldın' : invite.status === 'rejected' ? 'Reddedildi' : 'İptal edildi'}
        </span>
        <span className="ml-2 text-[10px] text-white/30">{dateText(invite.created_date)}</span>
      </span>
      {invite.status === 'pending' && isIncoming && <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />}
    </button>
  );

  return (
    <div className="space-y-3">
      {pendingReceived.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/50">Gelen Davetler ({pendingReceived.length})</p>
          <div className="space-y-2">{pendingReceived.map((invite) => row(invite, true))}</div>
        </div>
      )}
      {received.filter((invite) => invite.status !== 'pending').length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/50">Geçmiş Davetler</p>
          <div className="space-y-2">{received.filter((invite) => invite.status !== 'pending').map((invite) => row(invite, true))}</div>
        </div>
      )}
      {pendingSent.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/50">Gönderdiğim Davetler ({pendingSent.length})</p>
          <div className="space-y-2">{pendingSent.map((invite) => row(invite, false))}</div>
        </div>
      )}
    </div>
  );
}