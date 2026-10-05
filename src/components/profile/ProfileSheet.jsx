import ProfileMenuContent from '@/components/profile/ProfileMenuContent';

/** Alt menüdeki profil butonundan açılan menü: cüzdan kartları, profil ve çıkış burada. */
export default function ProfileSheet({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end lg:hidden">
      <button aria-label="Kapat" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-3xl animate-sheet-up"
        style={{
          background: 'rgba(18,18,21,0.99)',
          border: '1px solid rgba(174,184,196,0.15)',
          boxShadow: '0 -20px 60px -15px rgba(0,0,0,0.9)',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        }}
      >
        <span className="mx-auto mt-2 block h-1 w-10 rounded-full bg-white/25" />
        <ProfileMenuContent onClose={onClose} />
      </div>
    </div>
  );
}