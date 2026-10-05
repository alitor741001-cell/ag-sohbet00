import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, Building2, ChevronRight, Gem, Handshake, Hourglass, MailOpen, Mic2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AgencyCreateSheet from '@/components/agency/AgencyCreateSheet';
import { agencySectionBadge, agencySections } from '@/components/agency/agencySections';
import { AGENCY_GOLD, agencyApi } from '@/lib/agency';

/**
 * Profil sayfasındaki "AJANS İŞLEMLERİ" bölümü: rol ve duruma göre
 * değişen butonlar (ajans oluştur, davetler, yayıncı/ajans paneli, transfer).
 */
export default function AgencySection({ user, onRefresh, showHeading = true }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [sheet, setSheet] = useState('');
  const [justCreated, setJustCreated] = useState(false);

  const load = useCallback(() => {
    agencyApi('summary')
      .then((data) => setSummary(data))
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => { if (user) load(); }, [user?.id, load]);

  const profile = summary?.profile || {};
  // Özet gecikirse ya da alınamazsa kullanıcı kaydı geçici kaynak olur: yayıncıya
  // yanlışlıkla "ajans sistemine katıl" görünümü gösterilmez.
  const agencyRecordId = profile.agency_record_id || user?.agency_record_id || '';
  const role = profile.agency_role || user?.agency_role || '';
  const agencyName = summary?.agency?.name || profile.agency_name || user?.agency_name || 'Ajans';
  const agencyCode = profile.agency_code || user?.agency_code || '';
  const agencyStatus = summary?.agency?.status || profile.agency_status || '';
  // Ajans sahibi, ajans kaydının sahibine göre de doğrulanır (eski hesaplarda rol alanı eksik kalabiliyor).
  const effectiveRole = role === 'owner' || (!!summary?.agency?.owner_id && summary.agency.owner_id === user?.id) ? 'owner' : role;
  const isPending = effectiveRole === 'owner' && !!agencyRecordId && agencyStatus === 'pending';
  const isOwner = effectiveRole === 'owner' && !!agencyRecordId && !isPending;
  const isBroadcaster = effectiveRole === 'broadcaster' && !!agencyRecordId;
  const isAssistant = effectiveRole === 'assistant' && !!agencyRecordId;
  const inviteCount = (summary?.invites || []).filter((invite) => invite.status === 'pending').length;
  const sentCount = (summary?.invites_sent || []).filter((invite) => invite.status === 'pending').length;
  const transfer = summary?.transfer;
  const pendingTransfer = transfer?.status === 'pending' ? transfer : null;

  const afterChange = () => { load(); onRefresh?.(); };

  const sectionRole = isPending ? 'pending' : isOwner ? 'owner' : isAssistant ? 'assistant' : isBroadcaster ? 'broadcaster' : '';
  const baseActions = sectionRole ? agencySections(sectionRole) : [
    { key: 'davetler', label: 'Ajans Davetlerim', icon: MailOpen, path: '/ajans/davetler' },
    { key: 'create', label: 'Ajans Oluştur', icon: Building2 },
  ];
  // Yayıncı da kendi ajansını kurabilir: oluşturma düğmesi ajans değişikliğinin tam yanında durur.
  const orderedActions = sectionRole === 'broadcaster'
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
            {isPending || isOwner || isBroadcaster || isAssistant ? (
              <>
                <p className="truncate text-sm font-black text-white">{isPending ? '🏢 BAŞVURU ONAY BEKLİYOR' : isOwner ? '🏢 AJANS SAHİBİ' : isAssistant ? '🤝 AJANS ASİSTANI' : '🎤 YAYINCI'}</p>
                <p className="truncate text-[11px]" style={{ color: AGENCY_GOLD }}>
                  {agencyName} {agencyCode ? `• ${agencyCode}` : ''}
                </p>
                {isPending && (
                  <p className="mt-0.5 text-[10px] text-white/45">Yönetici onayından sonra resmi ajans sahibi olur ve yayıncı davet edebilirsin.</p>
                )}
                {isBroadcaster && profile.broadcaster_status !== 'active' && (
                  <p className="mt-0.5 text-[10px] text-white/45">Yayıncı durumun pasif</p>
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
            return action.path
              ? <Link key={action.key} to={action.path} className={rowClass}>{row}</Link>
              : <button key={action.key} type="button" onClick={() => setSheet('create')} className={rowClass}>{row}</button>;
          })}
        </div>
      </div>

      {/* Başvuru gönderildikten sonra ajans ayarları sayfası kendiliğinden açılır. */}
      <AgencyCreateSheet
        open={sheet === 'create'}
        onCreated={() => { setJustCreated(true); afterChange(); }}
        onClose={() => {
          setSheet('');
          if (justCreated) { setJustCreated(false); navigate('/ajans/ajansim'); }
        }}
      />
    </section>
  );
}