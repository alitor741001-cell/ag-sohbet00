import { useState } from 'react';
import { Gem, Handshake, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AgencyBroadcasterList from '@/components/agency/AgencyBroadcasterList';
import AgencyBroadcasterProfile from '@/components/agency/AgencyBroadcasterProfile';
import { agencyApi, AGENCY_GOLD, formatMoney, formatShortDiamonds } from '@/lib/agency';

/**
 * Bir asistanın kartı: isim ve profil görünür, payı ve kazancı yazar,
 * davet ettiği yayıncıların canlı kota durumu listelenir;
 * istenirse asistanlığı geri alınır.
 */
export default function AgencyAssistantCard({ assistant, onChanged }) {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const members = assistant?.members || [];

  const revoke = async () => {
    setBusy(true);
    try {
      await agencyApi('assistant-remove', { user_id: assistant.user_id });
      toast({ title: 'Asistanlık geri alındı', description: `${assistant.name} artık asistan değil.` });
      setConfirming(false);
      setProfileOpen(false);
      onChanged?.();
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#F5C542]/25 bg-white/5 p-3">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setProfileOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#F5C542]/45 bg-black/40">
            {assistant?.avatar
              ? <Image src={assistant.avatar} className="h-full w-full object-cover" fittingType="fill" />
              : <span className="text-sm font-black" style={{ color: AGENCY_GOLD }}>{(assistant?.name || 'A')[0]}</span>}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-white">{assistant?.name || 'Asistan'}</p>
            <p className="text-[10px] text-white/45">#{assistant?.member_id} • %{assistant?.share} pay • {assistant?.broadcaster_count || 0} yayıncı</p>
          </div>
        </button>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${assistant?.status === 'active' ? 'border-[#4ade80]/45 text-[#4ade80]' : 'border-white/20 text-white/50'}`}>
          {assistant?.status === 'active' ? 'Aktif' : assistant?.status === 'invited' ? 'Davet bekliyor' : 'Süresi doldu'}
        </span>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label="Asistanlığı geri al"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#FF8080]/45 text-[#FF8080] active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50">
        <span className="flex items-center gap-1">
          <Gem className="h-3 w-3 text-[#5AB8FF]" /> Yayıncı elması:
          <span className="font-black text-white">{formatShortDiamonds(members.reduce((sum, row) => sum + (Number(row.diamonds) || 0), 0))}</span>
        </span>
        <span>
          <Handshake className="mr-1 inline h-3 w-3" style={{ color: AGENCY_GOLD }} />
          Asistan kazancı:
          <span className="ml-1 font-black text-[#4ade80]">{formatMoney(assistant?.earnings || 0)}</span>
        </span>
      </div>

      <div className="mt-2.5">
        {members.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-[11px] text-white/45">
            Bu asistanın henüz yayıncısı yok.
          </p>
        ) : (
          <AgencyBroadcasterList members={members} share={Number(assistant?.share) || 0} />
        )}
      </div>

      {profileOpen && (
        <AgencyBroadcasterProfile
          member={{ user_id: assistant.user_id, name: assistant.name, avatar: assistant.avatar }}
          onClose={() => setProfileOpen(false)}
        />
      )}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Asistanlığı geri al"
        description={`${assistant?.name} kişisinin asistanlığı sona erer; davet ettiği yayıncılar ajansında kalır ve artık pay alamaz.`}
        confirmText={busy ? 'İşleniyor...' : 'Geri Al'}
        onConfirm={revoke}
      />
    </div>
  );
}