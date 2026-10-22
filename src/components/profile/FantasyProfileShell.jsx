import VoiceFantasyHero from '@/components/profile/VoiceFantasyHero';
import usePageScrollLock from '@/hooks/usePageScrollLock';

export default function FantasyProfileShell({ female, hidden, name, avatar, role, onClose, children }) {
  usePageScrollLock();
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Profil kartı">
      <button type="button" onClick={onClose} aria-label="Profili kapat" className="voice-fantasy-backdrop absolute inset-0" />
      <section data-fantasy={hidden ? 'masked' : female ? 'princess' : 'dragon'} className="voice-fantasy-card relative flex max-h-[88dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[2rem] border border-fantasy-gold/60 text-fantasy-text shadow-2xl">
        <div className="min-h-0 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
          <VoiceFantasyHero female={female} hidden={hidden} name={name} avatar={avatar} role={role} onClose={onClose} />
          {children}
        </div>
      </section>
    </div>
  );
}