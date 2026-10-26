import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import VoiceFantasyHero from '@/components/profile/VoiceFantasyHero';
import usePageScrollLock from '@/hooks/usePageScrollLock';
import { vipLook, vipVars } from '@/components/vip/vipTheme';
import useProfileSheetTop from '@/hooks/useProfileSheetTop';

export default function FantasyProfileShell({ female, hidden, name, avatar, role, onClose, children, profile, memberId, copied, onCopyId, seatAnchored = false, userId, self = false }) {
  usePageScrollLock();
  const navigate = useNavigate();
  const sheetTop = useProfileSheetTop(seatAnchored);
  // Karttaki profil resmine tekrar dokunmak kişinin tam sayfa profilini açar.
  const openFullPage = () => {
    if (hidden || !userId) return;
    onClose?.();
    navigate(self ? '/profil' : `/kullanici/${userId}`);
  };
  const card = !hidden && vipLook(profile, 'card');
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Profil kartı">
      <button type="button" onClick={onClose} aria-label="Profili kapat" className="voice-fantasy-backdrop absolute inset-0" />
      <section data-fantasy={hidden ? 'masked' : female ? 'princess' : 'dragon'} style={{ ...vipVars(card), ...(seatAnchored ? { height: `calc(100% - ${sheetTop}px)` } : {}) }} className={`voice-fantasy-card relative flex h-[100dvh] w-full flex-col overflow-hidden border border-fantasy-gold/60 pt-[env(safe-area-inset-top)] text-fantasy-text shadow-2xl ${card ? 'vip-profile-panel' : ''}`}>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
          <VoiceFantasyHero female={female} hidden={hidden} name={name} avatar={avatar} role={role} onClose={onClose} profile={profile}
            memberId={memberId} copied={copied} onCopyId={onCopyId} onOpenFull={openFullPage} />
          {children}
        </div>
      </section>
    </div>, document.body
  );
}