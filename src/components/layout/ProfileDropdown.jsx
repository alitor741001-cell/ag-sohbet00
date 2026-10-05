import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Image } from '@/components/ui/image';
import ProfileMenuContent from '@/components/profile/ProfileMenuContent';

export default function ProfileDropdown() {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!user) return null;

  const displayName = user?.username || user?.full_name || 'Profilim';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 transition-all active:scale-95"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(174,184,196,0.35)',
          boxShadow: open ? '0 0 12px rgba(174,184,196,0.3)' : '0 0 6px rgba(174,184,196,0.12)',
        }}
      >
        {user?.avatar ? (
          <Image src={user.avatar} className="w-7 h-7 rounded-full" fittingType="fill" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            {displayName[0]?.toUpperCase()}
          </span>
        )}
        <span className="hidden sm:block text-sm font-semibold text-white max-w-24 truncate">{displayName}</span>
        <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ background: 'rgba(18,18,21,0.98)', border: '1px solid rgba(174,184,196,0.15)', backdropFilter: 'blur(16px)', boxShadow: '0 20px 60px -15px rgba(0,0,0,0.8)' }}>
          {/* Purple gradient accent */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.6), transparent 70%)' }} />
          <ProfileMenuContent onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}