import { useState } from 'react';
import { Handshake, Loader2, Search, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import { AGENCY_GOLD, dateText, agencyApi } from '@/lib/agency';

const SHARES = [100, 75, 50, 25];
const STATUS = { invited: 'Davet bekliyor', active: 'Aktif', expired: 'Süresi doldu' };

/**
 * Ajansım > Asistanlık: üye kimliğiyle kişi bulunur, yüzdelik pay seçilir ve
 * asistanlık daveti gönderilir. En fazla 4 asistan verilebilir (7 gün geçerli davet).
 */
export default function AgencyAssistantPanel({ assistants = [], onChanged }) {
  const { toast } = useToast();
  const [memberId, setMemberId] = useState('');
  const [found, setFound] = useState(null);
  const [share, setShare] = useState(100);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState('');
  const [busyId, setBusyId] = useState('');

  const active = assistants.filter((row) => row.status === 'invited' || row.status === 'active');

  const search = async () => {
    const value = memberId.trim().replace('#', '');
    if (!value || searching) return;
    setSearching(true);
    setFound(null);
    try {
      const data = await agencyApi('invite-lookup', { member_id: value });
      if (!data.user) {
        toast({ title: 'Kullanıcı bulunamadı', variant: 'destructive' });
        return;
      }
      setFound(data.user);
    } catch (error) {
      toast({ title: 'Sorgulanamadı', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const appoint = async () => {
    if (!found || busy) return;
    setBusy('add');
    try {
      await agencyApi('assistant-appoint', { user_id: found.id, share });
      toast({ title: '🤝 Asistanlık daveti gönderildi', description: `${found.name} kişisine %${share} payla asistanlık daveti iletildi.` });
      setFound(null);
      setMemberId('');
      onChanged?.();
    } catch (error) {
      toast({ title: 'Davet gönderilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const remove = async (entry) => {
    setBusyId(entry.user_id);
    try {
      await agencyApi('assistant-remove', { user_id: entry.user_id });
      toast({ title: 'Asistanlık kaldırıldı', description: `${entry.name} artık asistan değil.` });
      onChanged?.();
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#F5C542]/25 bg-[#F5C542]/5 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider" style={{ color: AGENCY_GOLD }}>
          <Handshake className="h-3.5 w-3.5" /> Asistanlık Ver
        </p>
        <p className="mt-1 text-[10px] leading-snug text-white/50">
          Asistanın davet ettiği yayıncıların ajans komisyonundan seçtiğin yüzde kadar payı ona yazılır. En fazla 4 asistan verebilirsin.
        </p>
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
          <div className="mt-2.5 rounded-xl border border-white/12 bg-black/40 p-2.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15">
                {found.avatar
                  ? <Image src={found.avatar} className="h-full w-full object-cover" fittingType="fill" />
                  : <span className="text-xs font-bold">{(found.name || 'K')[0]}</span>}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{found.name}</p>
                <p className="text-[10px] text-white/45">
                  #{found.member_id}{found.agency_name ? ` • ${found.agency_name}` : ''}{found.agency_role === 'assistant' ? ' • Asistan' : ''}
                </p>
              </div>
            </div>
            {found.in_agency ? (
              <p className="mt-2 text-[10px] leading-snug text-[#FF8080]">Bu kullanıcı bir ajansa bağlı; önce ayrılması ya da transfer olması gerekir.</p>
            ) : (
              <>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/50">Komisyon payı</p>
                <div className="mt-1 flex gap-1.5">
                  {SHARES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setShare(value)}
                      className={`flex-1 rounded-lg border px-2 py-2 text-xs font-black ${share === value ? 'border-[#F5C542] bg-[#F5C542]/20 text-white' : 'border-white/15 text-white/60'}`}
                    >
                      %{value}
                    </button>
                  ))}
                </div>
                <button
                  onClick={appoint}
                  disabled={busy === 'add'}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-black text-black disabled:opacity-50"
                  style={{ background: AGENCY_GOLD }}
                >
                  {busy === 'add' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />} Asistanlık Daveti Gönder
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/50">Asistanlar ({active.length}/4)</p>
        {assistants.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-6 text-center">
            <Handshake className="mx-auto h-5 w-5 text-white/30" />
            <p className="mt-1.5 text-xs text-white/50">Henüz asistanın yok.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assistants.map((entry) => (
              <div key={entry.user_id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/40">
                  {entry.avatar
                    ? <Image src={entry.avatar} className="h-full w-full object-cover" fittingType="fill" />
                    : <span className="text-xs font-bold">{(entry.name || 'A')[0]}</span>}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entry.name}</p>
                  <p className="text-[10px] text-white/45">
                    %{entry.share} pay • {STATUS[entry.status] || entry.status}
                    {entry.status === 'invited' && entry.expires_at ? ` • ${dateText(entry.expires_at)}'e kadar` : ''}
                    {entry.status === 'active' ? ` • ${entry.broadcaster_count || 0} yayıncı` : ''}
                  </p>
                </div>
                {entry.status !== 'expired' && (
                  <button onClick={() => remove(entry)} disabled={busyId === entry.user_id} className="shrink-0 rounded-xl border border-[#FF8080]/45 px-2.5 py-1.5 text-[11px] font-bold text-[#FF8080] disabled:opacity-50">
                    {busyId === entry.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}