import { useState } from 'react';
import { Loader2, Search, Send, UserPlus, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import { AGENCY_GOLD, agencyApi } from '@/lib/agency';

/** Ajans sahibinin davet alanı: üye kimliğiyle yayıncı arar, davet gönderir ve bekleyenleri listeler. */
export default function AgencyInviteSender({ invites = [], onChanged }) {
  const { toast } = useToast();
  const [memberId, setMemberId] = useState('');
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState('');

  const search = async () => {
    const id = memberId.trim().replace('#', '');
    if (!id) return;
    setSearching(true);
    setFound(null);
    try {
      const data = await agencyApi('invite-lookup', { member_id: id });
      setFound(data.user || null);
      if (!data.user) toast({ title: 'Kullanıcı bulunamadı', variant: 'destructive' });
    } catch (error) {
      toast({ title: 'Sorgulanamadı', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const send = async () => {
    if (!found || sending) return;
    setSending(true);
    try {
      await agencyApi('invite', { user_id: found.id });
      toast({ title: 'Davet gönderildi', description: `${found.name} kişisine yayıncı daveti iletildi.` });
      setFound(null);
      setMemberId('');
      onChanged?.();
    } catch (error) {
      toast({ title: 'Davet gönderilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const cancel = async (invite) => {
    setBusyId(invite.id);
    try {
      await agencyApi('invite-cancel', { invite_id: invite.id });
      toast({ title: 'Davet iptal edildi' });
      onChanged?.();
    } catch (error) {
      toast({ title: 'İptal edilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#F5C542]/25 bg-[#F5C542]/5 p-3">
        <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: AGENCY_GOLD }}>📨 Davet Gönder</p>
        <div className="mt-2 flex gap-2">
          <input
            value={memberId}
            onChange={(event) => setMemberId(event.target.value)}
            inputMode="numeric"
            placeholder="Üye kimliği (örn: 1042)"
            className="min-w-0 flex-1 rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[#F5C542]/60"
          />
          <button onClick={search} disabled={searching || !memberId.trim()} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2.5 text-xs font-bold disabled:opacity-50">
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Sorgula
          </button>
        </div>
        {found && (
          <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-white/12 bg-black/40 p-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15">
              {found.avatar
                ? <Image src={found.avatar} className="h-full w-full object-cover" fittingType="fill" />
                : <span className="text-xs font-bold">{(found.name || 'K')[0]}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{found.name}</p>
              <p className="text-[10px] text-white/45">#{found.member_id}{found.agency_name ? ` • ${found.agency_name}` : ''}</p>
            </div>
            <button onClick={send} disabled={sending || !!found.agency_name || !found.friend} className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-black disabled:opacity-50" style={{ background: AGENCY_GOLD }}>
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : found.agency_name ? <X className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
              {found.agency_name ? 'Bağlı' : found.friend ? 'Davet Et' : 'Arkadaş Ekle'}
            </button>
          </div>
        )}
        {found && !found.friend && !found.agency_name && (
          <p className="mt-2 text-[10px] leading-snug" style={{ color: AGENCY_GOLD }}>
            Davet gönderebilmek için önce arkadaş olmanız gerekir. Kullanıcının profilinden arkadaşlık isteği gönder, kabul edilince davet edebilirsin.
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/50">Bekleyen Davetler ({invites.length})</p>
        {invites.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-6 text-center">
            <UserPlus className="mx-auto h-5 w-5 text-white/30" />
            <p className="mt-1.5 text-xs text-white/50">Bekleyen davet yok.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/40">
                  {invite.invitee_avatar
                    ? <Image src={invite.invitee_avatar} className="h-full w-full object-cover" fittingType="fill" />
                    : <span className="text-xs font-bold">{(invite.invitee_name || 'K')[0]}</span>}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{invite.invitee_name}</p>
                <button onClick={() => cancel(invite)} disabled={busyId === invite.id} className="shrink-0 rounded-xl border border-[#FF8080]/45 px-2.5 py-1.5 text-[11px] font-bold text-[#FF8080] disabled:opacity-50">
                  İptal
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}