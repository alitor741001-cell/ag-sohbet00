import { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Bell, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SupportNotifBell() {
  const { user } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = () => base44.entities.Notification.filter({ user_id: user.id, type: 'support', read: false }, '-created_date', 20).then(setItems).catch(() => {});
    load();
    const unsub = base44.entities.Notification.subscribe(load);
    return unsub;
  }, [user?.id]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
        <Bell className="w-5 h-5 text-white/60" />
        {items.length > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{items.length > 9 ? '9+' : items.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-[#16161e] border border-white/10 shadow-2xl overflow-hidden z-50">
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm font-bold text-white">Destek Bildirimleri</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {items.length === 0 ? <p className="p-4 text-sm text-gray-400 text-center">Bildirim yok</p> :
              items.map((n) => (
                <Link key={n.id} to={n.link || '/destek'} onClick={() => setOpen(false)} className="block p-3 border-b border-white/5 hover:bg-white/5">
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  {n.body && <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}