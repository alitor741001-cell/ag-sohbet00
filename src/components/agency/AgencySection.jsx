import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, Building2, ChevronRight, Gem, Handshake, Hourglass, MailOpen, Mic2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AgencyChangeSheet from '@/components/agency/AgencyChangeSheet';
import AgencyCreateSheet from '@/components/agency/AgencyCreateSheet';
import QuotaProgressCard from '@/components/agency/QuotaProgressCard';
import { agencySectionBadge, agencySections } from '@/components/agency/agencySections';
import { agencyLabel, resolveAgencyRole } from '@/lib/agencyRole';
import { AGENCY_GOLD, agencyApi, currentPeriod } from '@/lib/agency';

/**
 * Profil sayfasındaki "AJANS İŞLEMLERİ" bölümü: rol ve duruma göre
 * değişen butonlar (ajans oluştur, davetler, yayıncı/ajans paneli, transfer).
 */
// Profil her açıldığında ajans bölümü beklemeden görünsün: son veri anında gösterilir,
// yenisi arka planda tazelenir. Hesap değişince önbellek kullanılmaz.
let agencyCache = { userId: '', summary: null, quota: null };

export default function AgencySection({ user, onRefresh, showHeading = true }) {
  const navigate = useNavigate();
  const cache = user?.id && agencyCache.userId === user.id ? agencyCache : null;
  const [summary, setSummary] = useState(cache?.summary || null);
  const [sheet, setSheet] = useState('');
  const [justCreated, setJustCreated] = useState(false);
  const [quota, setQuota] = useState(cache?.quota || null);

  const load = useCallback(() => {
    agencyApi('summary')
      .then((data) => {
        agencyCache = { userId: user?.id || '', summary: data, quota: agencyCache.userId === user?.id ? agencyCache.quota : null };
        setSummary(data);
      })
      .catch(() => setSummary(null));
  }, [user?.id]);

  useEffect(() => { if (user) load(); }, [user?.id, load]);

  const profile = summary?.profile || {};
  // Rol sahip olunan ajansa göre çözülür: kişi başka bir ajanda yayıncı olsa da kendi ajansını yönetir.
  const role = resolveAgencyRole({
    profile: summary?.profile || user || {}, owned: summary?.owned_agency, membership: summary?.agency, userId: user?.id,
  });
  const isOwner = role === 'owner';
  const isPending = role === 'pending';
  const isBroadcaster = role === 'broadcaster';
  const isAssistant = role === 'assistant';
  const { name: agencyName, code: agencyCode } = agencyLabel({ profile, owned: summary?.owned_agency, membership: summary?.agency, role });
  // Yayıncı olarak bağlı olduğu ajans: kendi ajansı olsa bile kazanç ve kota akışı orada kalır.
  const memberAgencyId = profile.agency_record_id || user?.agency_record_id || '';
  const ownedAgencyId = profile.owned_agency_id || user?.owned_agency_id || '';
  const memberAgency = memberAgencyId
    ? {
        name: summary?.agency?.name || profile.agency_name || user?.agency_name || '',
        code: summary?.agency?.agency_id || profile.agency_code || user?.agency_code || '',
      }
    : null;
  // Kendi ajansı dışında yayıncı/asistan olarak bağlı olduğu ajans.
  const otherMemberAgency = memberAgency && memberAgencyId !== ownedAgencyId ? memberAgency : null;
  const inviteCount = (summary?.invites || []).filter((invite) => invite.status === 'pending').length;
  const sentCount = (summary?.invites_sent || []).filter((invite) => invite.status === 'pending').length;
  const transfer = summary?.transfer;
  const pendingTransfer = transfer?.status === 'pending' ? transfer : null;

  const afterChange = () => { load(); onRefresh?.(); };

  // Kota özeti: sahip ve yayıncı bu ayki elmasına göre ilerler; asistan kotada ilerlemez.
  useEffect(() => {
    if (!user?.id || (role !== 'owner' && role !== 'broadcaster')) { setQuota(null); return; }
    agencyApi(role === 'owner' ? 'agency-panel' : 'broadcaster')
      .then((data) => {
        agencyCache = { userId: user.id, summary: agencyCache.userId === user.id ? agencyCache.summary : null, quota: data };
        setQuota(data);
      })
      .catch(() => setQuota(null));
  }, [role, user?.id]);

  const quotaTiers = (quota?.tiers || []).filter((tier) => tier.active !== false);
  // Sahip kendi elmasıyla ilerler; geçen aydan kalan değer kota tamamlanmış sayılmaz.
  const monthDiamonds = role === 'owner'
    ? (user?.diamond_month_period === currentPeriod() ? (Number(user?.diamond_month) || 0) : 0)
    : (quota?.diamonds?.month || 0);
  const totalDiamonds = role === 'owner'
    ? Math.round((Number(user?.gift_received_k) || 0) * 1000)
    : (quota?.diamonds?.total || 0);
  const nextTier = quotaTiers.find((tier) => Number(tier.diamonds) > monthDiamonds) || null;
  const showQuota = !!quota && (role === 'owner' || role === 'broadcaster');

  const baseActions = role ? agencySections(role) : [
    { key: 'davetler', label: 'Ajans Davetlerim', icon: MailOpen, path: '/ajans/davetler' },
    { key: 'create', label: 'Ajans Oluştur', icon: Building2 },
  ];
  // Yayıncı da kendi ajansını kurabilir: oluşturma düğmesi ajans değişikliğinin tam yanında durur.
  const orderedActions = role === 'broadcaster'
    ? [
        ...baseActions.filter((item) => item.key !== 'davetler' && item.key !== 'transferler'),
        { key: 'create', label: 'Ajans Oluştur', icon: Building2 },
        ...baseActions.filter((item) => item.key === 'transferler'),
        ...baseActions.filter((item) => item.key === 'davetler'),
      ]
    : baseActions;
  const actions = orderedActions.map((item) => {
    const count = agencySectionBadge(item.key, { davetler: isOwner ? sentCount : inviteCount });
    return count ? { ...item, label: `${item.label} (${count})` } : item;
  });

  return (
    <section className="mb-6">
      {showHeading && (
        <div className="mb-3 flex items-center gap-2">
          <Gem className="h-4 w-4" style={{ color: AGENCY_GOLD }} />
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: AGENCY_GOLD }}>Ajans İşlemleri</h2>
          <span className="h-px flex-1 bg-gradient-to-r from-[#F5C542]/60 to-transparent" />
        </div>
      )}

      <div className="rounded-2xl border border-[#F5C542]/30 bg-gradient-to-br from-[#1a1305] via-[#0d0b16] to-[#140a1e] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#F5C542]/45 bg-black/50">
            {isPending ? <Hourglass className="h-5 w-5" style={{ color: AGENCY_GOLD }} /> : isOwner ? <Building2 className="h-5 w-5" style={{ color: AGENCY_GOLD }} /> : isAssistant ? <Handshake className="h-5 w-5" style={{ color: AGENCY_GOLD }} /> : <Mic2 className="h-5 w-5" style={{ color: AGENCY_GOLD }} />}
          </span>
          <div className="min-w-0 flex-1">
            {role ? (
              <>
                <p className="truncate text-sm font-black text-white">{isPending ? '🏢 BAŞVURU ONAY BEKLİYOR' : isOwner ? '🏢 AJANS SAHİBİ' : isAssistant ? '🤝 AJANS ASİSTANI' : '🎤 YAYINCI'}</p>
                <p className="truncate text-[11px]" style={{ color: AGENCY_GOLD }}>
                  {agencyName || 'Ajans'} {agencyCode ? `• ${agencyCode}` : ''}
                </p>
                {isPending && (
                  <p className="mt-0.5 text-[10px] text-white/45">Yönetici onayından sonra resmi ajans sahibi olur ve yayıncı davet edebilirsin.</p>
                )}
                {(isOwner || isPending) && !!otherMemberAgency && (
                  <p className="mt-0.5 text-[10px] text-white/45">
                    Yayıncı olduğun ajans: {otherMemberAgency.name || 'Ajans'}{otherMemberAgency.code ? ` • ${otherMemberAgency.code}` : ''} — gelen hediyeler ve kotan bu ajansa işler.
                  </p>
                )}
                {isBroadcaster && profile.broadcaster_status !== 'active' && (
                  <p className="mt-0.5 text-[10px] text-white/45">Yayıncı durumun pasif</p>
                )}
                {/* Asistanlık yayıncı rolünü kaldırmaz: aktif yayıncıysa profilinde yayıncı etiketi kalır. */}
                {isAssistant && profile.broadcaster_status === 'active' && (
                  <p className="mt-0.5 text-[10px] text-white/45">🎤 Yayıncı rolün de aktif — hediyeler ve kotan ajansa işler.</p>
                )}
              </>
            ) : (
              <>
                <p className="truncate text-sm font-black text-white">Ajans sistemine katıl</p>
                <p className="truncate text-[11px] text-white/50">Kendi ajansını kur ya da gelen davetleri değerlendir.</p>
              </>
            )}
          </div>
          {inviteCount > 0 && (
            <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-black text-black" style={{ background: AGENCY_GOLD }}>
              {inviteCount}
            </span>
          )}
        </div>

        {pendingTransfer && (
          <Link to="/ajans/transferler" className="mt-3 flex w-full items-center gap-2 rounded-xl border border-[#5AB8FF]/40 bg-[#5AB8FF]/10 px-3 py-2.5 text-left">
            <ArrowLeftRight className="h-4 w-4 shrink-0 text-[#5AB8FF]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-[#5AB8FF]">Transfer talebin onay bekliyor</span>
              <span className="block truncate text-[10px] text-white/50">{pendingTransfer.from_agency_name || 'Eski ajans'} → {pendingTransfer.to_agency_name}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
          </Link>
        )}

        {showQuota && (
          <div className="mt-3">
            <QuotaProgressCard month={monthDiamonds} total={totalDiamonds} nextTier={nextTier} tiers={quotaTiers} />
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const rowClass = 'flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-left active:scale-[0.98]';
            const row = (
              <>
                <action.icon className="h-4 w-4 shrink-0" style={{ color: AGENCY_GOLD }} />
                <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white">{action.label}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/35" />
              </>
            );
            // Ajans değişikliği buradan başlar: ayrı sayfaya gitmeden yeni ajans
            // sorgulanır, talep gönderilir ve onaylar aynı yerden izlenir.
            if (action.key === 'transferler') {
              return <button key={action.key} type="button" onClick={() => setSheet('change')} className={rowClass}>{row}</button>;
            }
            return action.path
              ? <Link key={action.key} to={action.path} className={rowClass}>{row}</Link>
              : <button key={action.key} type="button" onClick={() => setSheet('create')} className={rowClass}>{row}</button>;
          })}
        </div>
      </div>

      {/* Başvuru gönderildikten sonra ajans ayarları sayfası kendiliğinden açılır. */}
      <AgencyCreateSheet
        open={sheet === 'create'}
        memberAgency={otherMemberAgency}
        onCreated={() => { setJustCreated(true); afterChange(); }}
        onClose={() => {
          setSheet('');
          if (justCreated) { setJustCreated(false); navigate('/ajans/ajansim'); }
        }}
      />

      {/* Ajans değişikliği: eski ve yeni ajans sahibinin onayıyla tamamlanır. */}
      <AgencyChangeSheet open={sheet === 'change'} onClose={() => setSheet('')} onChanged={afterChange} />
    </section>
  );
}