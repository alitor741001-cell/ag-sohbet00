import { createPortal } from 'react-dom';
import VoiceFantasyHero from '@/components/profile/VoiceFantasyHero';
import usePageScrollLock from '@/hooks/usePageScrollLock';
import { vipLook, vipVars } from '@/components/vip/vipTheme';
import useProfileSheetTop from '@/hooks/useProfileSheetTop';

export default function FantasyProfileShell({ female, hidden, name, avatar, role, onClose, children, profile, memberId, copied, onCopyId, seatAnchored = false, full = false, onBack, onOpenFull, liveLink = null }) {
  usePageScrollLock();
  // Tam ekranda kart en üstten başlar; kart görünümünde koltuk hizasına kadar kırpılır.
  const anchored = seatAnchored && !full;
  const sheetTop = useProfileSheetTop(anchored);
  const card = !hidden && vipLook(profile, 'card');
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Profil kartı">
      <button type="button" onClick={onClose} aria-label="Profili kapat" className="voice-fantasy-backdrop absolute inset-0" />
      <section data-fantasy={hidden ? 'masked' : female ? 'princess' : 'dragon'} style={{ ...vipVars(card), height: anchored ? `calc(100% - ${sheetTop}px)` : 'calc(100% - env(safe-area-inset-top, 0px))' }} className={`voice-fantasy-card relative flex w-full flex-col overflow-hidden rounded-t-[2rem] border border-fantasy-gold/60 text-fantasy-text shadow-2xl ${card ? 'vip-profile-panel' : ''}`}>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
          <VoiceFantasyHero female={female} hidden={hidden} name={name} avatar={avatar} role={role} onClose={onClose} profile={profile}
            memberId={memberId} copied={copied} onCopyId={onCopyId} full={full} onBack={onBack} onOpenFull={onOpenFull} liveLink={liveLink} />
          {children}
        </div>
      </section>
    </div>, document.body
  );
}