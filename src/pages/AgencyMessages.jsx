import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AgencyInvitesPanel from '@/components/agency/AgencyInvitesPanel';
import InviteDetailSheet from '@/components/agency/InviteDetailSheet';

/** Ajans mesajları: gelen/gönderilen ajans davetleri tek sayfada, kendi geri düğmesiyle açılır. */
export default function AgencyMessages() {
  const navigate = useNavigate();
  const [inviteId, setInviteId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/arkadaslar?view=chats', { replace: true }));

  return (
    <div className="dark mx-auto min-h-[calc(100vh-8rem)] w-full min-w-0 max-w-5xl bg-background text-white supports-[height:100dvh]:min-h-[calc(100dvh-8rem)]">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#F2CE6B]/25 px-3 py-2.5" style={{ background: 'rgba(9,7,13,0.94)' }}>
        <button type="button" onClick={goBack} aria-label="Geri" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#F2CE6B]/30 bg-white/5 text-[#ffeec2] active:scale-95">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="flex-1 text-center text-base font-black uppercase tracking-[0.18em] text-[#ffeec2]" style={{ textShadow: '0 0 6px rgba(255,214,120,0.9), 0 0 18px rgba(239,68,68,0.75)' }}>Ajans Mesajları</h1>
        <span className="h-9 w-9" />
      </header>

      <div className="p-3">
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