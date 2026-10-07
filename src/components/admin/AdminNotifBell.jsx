import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, CheckCheck, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';

export default function AdminNotifBell({ notifGranted }) {
  const { notifications, unreadCount, markAllRead, deleteAll } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="shrink-0">
      <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-white/5 relative" title="Bildirimler">
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        {notifGranted && unreadCount === 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" />}
      </button>
      {open && createPortal(
        // Tam ekran bildirim paneli. Portal ile doğrudan gövdeye taşınır: üst çubuktaki
        // bulanıklık katmanı fixed kutuyu kendi boyuna kısıtlıyordu, panel ekranı kaplamıyordu.
        <div className="fixed inset-0 z-[70] flex flex-col bg-[#121215] sm:items-center sm:justify-center sm:bg-black/70 sm:p-6 sm:backdrop-blur-sm">
          <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#121215] pt-[env(safe-area-inset-top)] sm:h-auto sm:max-h-[80vh] sm:w-96 sm:rounded-xl sm:border sm:border-white/10 sm:pt-0 sm:shadow-2xl">
            <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10">
              <button onClick={() => setOpen(false)} title="Geri" aria-label="Geri" className="p-2 rounded-full hover:bg-white/10 text-white shrink-0"><ArrowLeft className="w-6 h-6" /></button>
              <p className="text-sm font-bold text-white">Bildirimler</p>
              <div className="ml-auto flex gap-1">
                <button onClick={markAllRead} title="Tümünü okundu işaretle" className="p-1.5 rounded-lg hover:bg-white/5"><CheckCheck className="w-4 h-4 text-white/60" /></button>
                <button onClick={deleteAll} title="Tümünü sil" className="p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto sm:max-h-96">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-xs text-white/40">Bildirim yok</p>
              ) : notifications.slice(0, 20).map((n) => (
                <div key={n.id} className={`px-4 py-2.5 border-b border-white/5 ${n.read ? '' : 'bg-purple-500/5'}`}>
                  <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                  {n.body && <p className="text-[11px] text-white/50 truncate">{n.body}</p>}
                </div>
              ))}
            </div>
            <button onClick={() => { setOpen(false); navigate('/admin/bildirimler'); }} className="w-full flex items-center justify-center gap-1 px-4 py-3 text-xs font-semibold text-purple-400 hover:bg-white/5 border-t border-white/10 shrink-0">
              Tüm Bildirimler <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}