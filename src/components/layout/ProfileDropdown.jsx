import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser, membershipActive } from '@/lib/useCurrentUser';
import { ChevronDown, Settings, LogOut, User, CreditCard, Shield } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function ProfileDropdown() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;
  const isAdmin = user.role === 'admin' || user.role === 'moderator';

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full p-0.5 hover:bg-white/5 transition-colors">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          {user.avatar ? <Image src={user.avatar} alt={user.full_name} className="w-full h-full" fittingType="fill" /> : <span className="text-sm font-bold text-white">{(user.full_name || user.email || '?')[0]}</span>}
        </div>
        <ChevronDown className="w-4 h-4 text-white/60 hidden sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#16161e] border border-white/10 shadow-2xl overflow-hidden z-50">
          <div className="p-3 border-b border-white/5">
            <p className="text-sm font-bold text-white truncate">{user.full_name || user.username}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <div className="p-1">
            <button onClick={() => { setOpen(false); navigate('/profil'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5"><User className="w-4 h-4" /> Profilim</button>
            <button onClick={() => { setOpen(false); navigate('/abonelik'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5"><CreditCard className="w-4 h-4" /> Abonelik</button>
            {isAdmin && <button onClick={() => { setOpen(false); navigate('/admin'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5"><Shield className="w-4 h-4" /> Admin Panel</button>}
            <button onClick={() => { setOpen(false); base44.auth.logout(); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10"><LogOut className="w-4 h-4" /> Çıkış</button>
          </div>
        </div>
      )}
    </div>
  );
}