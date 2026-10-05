import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, Building2, ChevronRight, Gem, Hourglass, MailOpen, Mic2, Sparkles, Wallet } from 'lucide-react';
import AgencySheet from '@/components/agency/AgencySheet';
import AgencyCreateSheet from '@/components/agency/AgencyCreateSheet';
import InviteDetailSheet from '@/components/agency/InviteDetailSheet';
import AgencyInvitesPanel from '@/components/agency/AgencyInvitesPanel';
import BroadcasterPanel from '@/components/agency/BroadcasterPanel';
import AgencyPanel from '@/components/agency/AgencyPanel';
import AgencyChangeSheet from '@/components/agency/AgencyChangeSheet';
import { AGENCY_GOLD, agencyApi } from '@/lib/agency';

const TITLES = {
  invite: '🎤 Ajans Davetlerim',
  broadcaster: '🎤 Yayıncı Panelim',
  agency: '🏢 Ajansım',
  change: '🔄 Ajans Değişikliği',
};

/**
 * Profil sayfasındaki "AJANS İŞLEMLERİ" bölümü: rol ve duruma göre
 * değişen butonlar (ajans oluştur, davetler, yayıncı/ajans paneli, transfer).
 */
export default function AgencySection({ user, onRefresh }) {
  const [summary, setSummary] = useState(null);
  const [sheet, setSheet] = useState('');
  const [panelTab, setPanelTab] = useState('quota');
  const [inviteId, setInviteId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(() => {
    agencyApi('summary')
      .then((data) => setSummary(data))
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => { if (user) load(); }, [user?.id, load, refreshKey]);

  const profile = summary?.profile || {};
  const role = profile.agency_role || user?.agency_role || '';
  const agencyStatus = summary?.agency?.status || profile.agency_status || '';
  const isPending = role === 'owner' && !!profile.agency_record_id && agencyStatus === 'pending';
  const isOwner = role === 'owner' && !!profile.agency_record_id && !isPending;
  const isBroadcaster = role === 'broadcaster' && !!profile.agency_record_id;
  const inviteCount = (summary?.invites || []).filter((invite) => invite.status === 'pending').length;
  const sentCount = (summary?.invites_sent || []).filter((invite) => invite.status === 'pending').length;
  const transfer = summary?.transfer;
  const pendingTransfer = transfer?.status === 'pending' ? transfer : null;

  const openInvite = (id) => { setInviteId(id); setSheet('invite-detail'); };
  const openPanel = (target, tab) => { setPanelTab(tab); setSheet(target); };
  const afterChange = () => { setRefreshKey((value) => value + 1); onRefresh?.(); };

  const actions = isPending ? [
    { key: 'application', label: 'Başvuru Bilgileri', icon: Building2, onClick: () => openPanel('agency', 'stats') },
    { key: 'invites', label: `Ajans Davetlerim${inviteCount ? ` (${inviteCount})` : ''}`, icon: MailOpen, onClick: () => setSheet('invites') },
  ] : isOwner ? [
    { key: 'agency-stats', label: 'Ajans Yönetimi', icon: Building2, onClick: () => openPanel('agency', 'stats') },
    { key: 'agency-members', label: 'Yayıncılarım', icon: Mic2, onClick: () => openPanel('agency', 'broadcasters') },
    { key: 'agency-earnings', label: 'Ajans Kazancım', icon: Wallet, onClick: () => openPanel('agency', 'stats') },
    { key: 'agency-invites', label: `Davet Gönder${sentCount ? ` (${sentCount})` : ''}`, icon: MailOpen, onClick: () => openPanel('agency', 'invites') },
    { key: 'agency-transfers', label: 'Transfer Talepleri', icon: ArrowLeftRight, onClick: () => openPanel('agency', 'transfers') },
    { key: 'agency-settings', label: 'Ajans Ayarları', icon: Sparkles, onClick: () => openPanel('agency', 'settings') },
  ] : isBroadcaster ? [
    { key: 'bc-panel', label: 'Yayıncı Panelim', icon: Mic2, onClick: () => openPanel('broadcaster', 'quota') },
    { key: 'bc-agency', label: 'Ajansım', icon: Building2, onClick: () => openPanel('broadcaster', 'quota') },
    { key: 'bc-earnings', label: 'Kazançlarım', icon: Wallet, onClick: () => openPanel('broadcaster', 'earnings') },
    { key: 'bc-change', label: 'Ajans Değişikliği', icon: ArrowLeftRight, onClick: () => setSheet('change') },
  ] : [
    { key: 'create', label: 'Ajans Oluştur', icon: Building2, onClick: () => setSheet('create') },
    { key: 'invites', label: `Ajans Davetlerim${inviteCount ? ` (${inviteCount})` : ''}`, icon: MailOpen, onClick: () => setSheet('invites') },
  ];

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Gem className="h-4 w-4" style={{ color: AGENCY_GOLD }} />
        <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: AGENCY_GOLD }}>Ajans İşlemleri</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-[#F5C542]/60 to-transparent" />
      </div>

      <div className="rounded-2xl border border-[#F5C542]/30 bg-gradient-to-br from-[#1a1305] via-[#0d0b16] to-[#140a1e] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#F5C542]/45 bg-black/50">
            {isPending ? <Hourglass className="h-5 w-5" style={{ color: AGENCY_GOLD }} /> : isOwner ? <Building2 className="h-5 w-5" style={{ color: AGENCY_GOLD }} /> : <Mic2 className="h-5 w-5" style={{ color: AGENCY_GOLD }} />}
          </span>
          <div className="min-w-0 flex-1">
            {isPending || isOwner || isBroadcaster ? (
              <>
                <p className="truncate text-sm font-black text-white">{isPending ? '🏢 BAŞVURU ONAY BEKLİYOR' : isOwner ? '🏢 AJANS SAHİBİ' : '🎤 YAYINCI'}</p>
                <p className="truncate text-[11px]" style={{ color: AGENCY_GOLD }}>
                  {summary?.agency?.name || profile.agency_name || 'Ajans'} {profile.agency_code ? `• ${profile.agency_code}` : ''}
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
          <button onClick={() => setSheet('change')} className="mt-3 flex w-full items-center gap-2 rounded-xl border border-[#5AB8FF]/40 bg-[#5AB8FF]/10 px-3 py-2.5 text-left">
            <ArrowLeftRight className="h-4 w-4 shrink-0 text-[#5AB8FF]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-[#5AB8FF]">Transfer talebin onay bekliyor</span>
              <span className="block truncate text-[10px] text-white/50">{pendingTransfer.from_agency_name || 'Eski ajans'} → {pendingTransfer.to_agency_name}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
          </button>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <button
              key={action.key}
              onClick={action.onClick}
              className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-left active:scale-[0.98]"
            >
              <action.icon className="h-4 w-4 shrink-0" style={{ color: AGENCY_GOLD }} />
              <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white">{action.label}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/35" />
            </button>
          ))}
        </div>
      </div>

      <AgencyCreateSheet open={sheet === 'create'} onClose={() => setSheet('')} onCreated={afterChange} />

      <AgencySheet open={sheet === 'invites'} onClose={() => setSheet('')} icon={MailOpen} title={TITLES.invite} subtitle="Gelen ve gönderilen davetler">
        <AgencyInvitesPanel open={sheet === 'invites'} onOpenInvite={openInvite} refreshKey={refreshKey} />
      </AgencySheet>

      <InviteDetailSheet open={sheet === 'invite-detail'} inviteId={inviteId} onClose={() => setSheet('')} onAnswered={afterChange} />

      <BroadcasterPanel open={sheet === 'broadcaster'} tab={panelTab} onClose={() => setSheet('')} />

      <AgencyPanel open={sheet === 'agency'} tab={panelTab} userId={user?.id} onClose={() => { setSheet(''); afterChange(); }} />

      <AgencyChangeSheet open={sheet === 'change'} onClose={() => setSheet('')} onChanged={afterChange} />
    </section>
  );
}