import { useEffect, useState } from 'react';
import { ChevronRight, Loader2, MailOpen, Trash2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import EmptyState from '@/components/movie/EmptyState';
import { AGENCY_GOLD, agencyApi, dateText } from '@/lib/agency';

/** Davetlerim: gelen ve gönderilen yayıncı davetleri. */
export default function AgencyInvitesPanel({ open = true, compact = false, onOpenInvite, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

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
  const sent = data?.sent || [];
  const pendingReceived = received.filter((invite) => invite.status === 'pending');
  const pendingSent = sent.filter((invite) => invite.status === 'pending');

  if (!compact && received.length === 0 && sent.length === 0) {
    // Boş durum, sistem bildirimleriyle aynı görünümde gösterilir.
    return <EmptyState icon={MailOpen} title="Davet yok" description="Henüz ajans davetin bulunmuyor." />;
  }

  const clearAll = async () => {
    if (clearing) return;
    setClearing(true);
    await agencyApi('invite-clear').catch(() => {});
    setData({ received: [], sent: [] });
    setClearing(false);
  };

  /* Satırlar sistem bildirimleriyle aynı kart dilinde: nokta, başlık, alt yazı, tarih. */
  const row = (invite, isIncoming) => (
    <button
      key={invite.id}
      onClick={() => isIncoming && invite.status === 'pending' && onOpenInvite?.(invite.id)}
      className={`flex w-full gap-3 rounded-xl border p-3 text-left active:scale-[0.99] ${invite.status === 'pending' ? 'border-primary/30 bg-primary/10' : 'border-white/10 bg-white/5'}`}
    >
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${invite.status === 'pending' ? 'bg-primary' : 'bg-transparent'}`} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {invite.agency_logo && <Image src={invite.agency_logo} className="h-5 w-5 shrink-0 rounded-full object-cover" fittingType="fill" />}
          <span className="truncate text-sm font-semibold text-white">{invite.agency_name}</span>
        </span>
        <span className="block truncate text-sm text-gray-400">
          {invite.agency_code} • {isIncoming ? `${invite.owner_name} davet etti` : invite.invitee_name}
        </span>
        <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${
          invite.status === 'pending' ? 'border-[#F5C542]/45 text-[#F5C542]'
            : invite.status === 'accepted' ? 'border-[#4ade80]/45 text-[#4ade80]'
              : 'border-white/20 text-white/45'}`}
        >
          {invite.status === 'pending' ? 'Onay bekliyor' : invite.status === 'accepted' ? 'Katıldın' : invite.status === 'rejected' ? 'Reddedildi' : 'İptal edildi'}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="whitespace-nowrap text-[10px] font-medium tabular-nums text-gray-500">{dateText(invite.created_date)}</span>
        {invite.status === 'pending' && isIncoming && <ChevronRight className="h-4 w-4 text-white/40" />}
      </span>
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Mesaj olduğunda topluca silme: gelen ve gönderilen davetler listeden kaldırılır. */}
      <div className="flex justify-end">
        <button type="button" onClick={clearAll} disabled={clearing} className="flex items-center gap-1 rounded-full border border-red-400/40 bg-red-500/15 px-3 py-1 text-[11px] font-bold text-red-300 active:scale-95 disabled:opacity-60">
          <Trash2 className="h-3.5 w-3.5" /> {clearing ? 'Siliniyor…' : 'Tümünü Sil'}
        </button>
      </div>
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