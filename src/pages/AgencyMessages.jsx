import { useEffect, useState } from 'react';
import { markSeen } from '@/lib/seenBadge';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AgencyInvitesPanel from '@/components/agency/AgencyInvitesPanel';
import InviteDetailSheet from '@/components/agency/InviteDetailSheet';

/** Ajans mesajları: gelen/gönderilen ajans davetleri tek sayfada, kendi geri düğmesiyle açılır. */
export default function AgencyMessages({ onBack, embedded = false }) {
  const navigate = useNavigate();
  const [inviteId, setInviteId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useCurrentUser();
  useEffect(() => { markSeen('agency', user?.id); }, [user?.id]);
  const goBack = onBack || (() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/arkadaslar?view=chats', { replace: true })));

  return (
    <div className={embedded ? 'dark w-full text-white' : 'dark min-h-[var(--app-height)] w-full text-white'} style={embedded ? undefined : { background: '#0a0a0d' }}>
      {/* Üst başlık ve geri düğmesi sabittir: içerik kayarken yerinden oynamaz. */}
      {!embedded && <header className="fixed inset-x-0 top-0 z-30 flex items-center gap-2 border-b border-[#F2CE6B]/25 bg-[#0a0a0d] px-3 pb-2.5" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.6rem)' }}>
        <button type="button" onClick={goBack} aria-label="Geri" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#F2CE6B]/30 bg-white/5 text-[#ffeec2] active:scale-95">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="flex-1 text-center text-base font-black uppercase tracking-[0.18em] text-[#ffeec2]" style={{ textShadow: '0 0 6px rgba(255,214,120,0.9), 0 0 18px rgba(239,68,68,0.75)' }}>Ajans Mesajları</h1>
        <span className="h-9 w-9" />
      </header>}

      <div className="p-3" style={embedded ? undefined : { paddingTop: 'calc(env(safe-area-inset-top) + 4.25rem)' }}>
        <AgencyInvitesPanel open onOpenInvite={setInviteId} refreshKey={refreshKey} />
      </div>

      <InviteDetailSheet
        open={!!inviteId}
        inviteId={inviteId}
        onClose={() => setInviteId('')}
        onAnswered={() => { setInviteId(''); setRefreshKey((value) => value + 1); }}
      />
    </div>
  );
}