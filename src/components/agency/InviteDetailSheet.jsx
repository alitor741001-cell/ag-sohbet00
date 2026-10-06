import { useEffect, useState } from 'react';
import { Check, Clock, Loader2, ShieldCheck, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import AgencySheet from '@/components/agency/AgencySheet';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { AGENCY_GOLD, agencyApi } from '@/lib/agency';

const COUNTDOWN_SECONDS = 10;

// Asistanlık davetinde gösterilen görev ve sınırlar listesi.
const ASSISTANT_RULES = [
  '🎤 Odalara giriş yapıp kullanıcıları karşılar.',
  '👥 Yeni kullanıcılarla ilgilenir ve yardımcı olur.',
  '🛡️ Oda düzenini ve sohbet kurallarını takip eder.',
  '🚫 Kural ihlallerini yöneticilere bildirir.',
  '⚠️ Kullanıcılara gerektiğinde uyarı verir.',
  '🎁 Etkinlik, hediye ve oda aktivitelerine destek olur.',
  '💬 Kullanıcı sorularına cevap verir.',
  '👑 Admin veya yöneticinin verdiği görevleri yerine getirir.',
  '❌ Kendi başına admin yetkisi kullanamaz.',
  '🔒 Kullanıcıların özel bilgilerini paylaşamaz.',
  '⚖️ Kullanıcılara karşı tarafsız ve saygılı davranır.',
  '🚫 Yetkisini kötüye kullanamaz veya kişisel çıkar için kullanamaz.',
];

/**
 * Davet detayı: ajans bilgisi, ajans sahibi ve sözleşme kuralları.
 * Onay butonu 10 saniye geri sayımdan sonra aktifleşir.
 */
export default function InviteDetailSheet({ open, inviteId, onClose, onAnswered }) {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [left, setLeft] = useState(COUNTDOWN_SECONDS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !inviteId) return;
    setLoading(true);
    setData(null);
    setLeft(COUNTDOWN_SECONDS);
    agencyApi('invite-detail', { invite_id: inviteId })
      .then((result) => setData(result))
      .catch((error) => toast({ title: 'Davet açılamadı', description: error.response?.data?.error || error.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [open, inviteId]);

  useEffect(() => {
    if (!open || loading) return;
    const timer = setInterval(() => setLeft((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [open, loading]);

  const respond = async (accept) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await agencyApi('invite-respond', { invite_id: inviteId, accept });
      toast(accept
        ? { title: '🎉 Tebrikler!', description: data?.invite?.kind === 'assistant' ? `${data?.invite?.agency_name} ajansının asistanı oldun.` : `${data?.invite?.agency_name} ajansına katıldın.` }
        : { title: 'Davet reddedildi', description: `${data?.invite?.agency_name} ajansı davetini reddettin.` });
      onAnswered?.(result);
      onClose?.();
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const invite = data?.invite;
  const isAssistantInvite = invite?.kind === 'assistant';
  // Kimlik numarası davet kaydında saklanır; kendi davetinde hesabından da okunur.
  const inviteeMemberId = invite?.invitee_member_id || (invite?.invitee_id === user?.id ? user?.member_id || '' : '') || '—';
  const rules = String(data?.rules || '').split('\n').filter(Boolean);

  return (
    <AgencySheet open={open} tall onClose={onClose} title={isAssistantInvite ? '🤝 Asistanlık Daveti' : '🎤 Yayıncı Daveti'} subtitle={invite ? `${invite.agency_name} • ${invite.agency_code}` : 'Davet yükleniyor'}>
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: AGENCY_GOLD }} /></div>
      ) : !invite ? (
        <p className="py-16 text-center text-sm text-white/50">Davet bulunamadı.</p>
      ) : (
        <div className="space-y-4 pb-2">
          <div className="flex items-center gap-3 rounded-2xl border border-[#F5C542]/35 bg-gradient-to-br from-[#221806] to-[#0b0910] p-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#F5C542]/45 bg-black/50">
              {invite.agency_logo
                ? <Image src={invite.agency_logo} className="h-full w-full object-cover" fittingType="fill" />
                : <span className="text-2xl font-black" style={{ color: AGENCY_GOLD }}>{invite.agency_name?.[0] || 'A'}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black">{invite.agency_name}</p>
              <p className="text-[11px] font-semibold" style={{ color: AGENCY_GOLD }}>{invite.agency_code}</p>
              <p className="mt-0.5 truncate text-[11px] text-white/55">{invite.agency_description || 'Yayıncı ajansı'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 p-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/50">
              {invite.owner_avatar
                ? <Image src={invite.owner_avatar} className="h-full w-full object-cover" fittingType="fill" />
                : <span className="text-sm font-bold">{(invite.owner_name || 'A')[0]}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-white/45">Ajans Sahibi</p>
              <p className="truncate text-sm font-bold">{invite.owner_name}</p>
            </div>
            <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: AGENCY_GOLD }} />
          </div>

          {/* Davet edilen kişi: profili, ismi ve kimlik numarası. */}
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-400/40 bg-black/50">
              {invite.invitee_avatar
                ? <Image src={invite.invitee_avatar} className="h-full w-full object-cover" fittingType="fill" />
                : <span className="text-sm font-bold">{(invite.invitee_name || 'K')[0]}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-white/45">Davet Edilen</p>
              <p className="truncate text-sm font-bold">{invite.invitee_name || user?.username || user?.full_name || 'Kullanıcı'}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/45">Kimlik</p>
              <p className="text-xs font-black" style={{ color: AGENCY_GOLD }}>{inviteeMemberId}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-[11px] font-black uppercase tracking-wider" style={{ color: AGENCY_GOLD }}>{isAssistantInvite ? 'Asistanlık Kuralları' : 'Ajans Kuralları & Sözleşme'}</p>
            <ul className="space-y-1.5">
              {(isAssistantInvite ? ASSISTANT_RULES : rules).map((rule) => (
                <li key={rule} className="flex gap-2 text-[11px] leading-relaxed text-white/70">
                  {!isAssistantInvite && <Check className="mt-0.5 h-3 w-3 shrink-0" style={{ color: AGENCY_GOLD }} />}
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-white/45">Gönderen</p>
              <p className="truncate text-xs font-bold">{invite.owner_name}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-white/45">Ajans ID</p>
              <p className="text-xs font-bold" style={{ color: AGENCY_GOLD }}>{invite.agency_code}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/50">
            <Clock className="h-3 w-3" /> Lütfen kuralları okuyun — onay {left > 0 ? `${left} saniye` : 'hazır'}
          </div>

          <button
            onClick={() => respond(true)}
            disabled={busy || left > 0}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#38bdf8] to-[#2563eb] py-3.5 text-sm font-black text-white shadow-[0_0_26px_-8px_rgba(56,189,248,0.95)] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {left > 0 ? `ONAYLA (${left})` : 'ONAYLA'}
          </button>
          <button onClick={() => respond(false)} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 py-3 text-sm font-bold text-white/70 disabled:opacity-50">
            <X className="h-4 w-4" /> Reddet
          </button>
        </div>
      )}
    </AgencySheet>
  );
}