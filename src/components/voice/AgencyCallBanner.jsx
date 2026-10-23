import { Megaphone, X } from 'lucide-react';

/** Ajans çağrısı kartı: ajans adı, gönderen profil/isim, açıklama ve Katıl. */
export default function AgencyCallBanner({ call, onJoin, onClose }) {
  if (!call) return null;
  return (
    <div className="fixed inset-x-3 top-20 z-[70] mx-auto max-w-sm rounded-2xl border border-[#FFD700]/60 bg-black/85 p-3 text-white shadow-[0_0_24px_-6px_rgba(255,215,0,0.9)] backdrop-blur">
      <button type="button" onClick={onClose} aria-label="Kapat" className="absolute right-1 top-1 p-2 text-white/60"><X className="h-4 w-4" /></button>
      <p className="flex items-center gap-1.5 pr-6 text-sm font-black text-[#FFD700]"><Megaphone className="h-4 w-4" /> {call.agency_name}</p>
      <p className="mt-0.5 text-xs text-white/80">katılmaya davet ediyor</p>
      <div className="mt-2 flex items-center gap-2">
        {call.sender_avatar
          ? <img src={call.sender_avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
          : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold">{(call.sender_name || '?')[0]}</span>}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{call.sender_name}</p>
          <p className="text-[10px] text-white/50">{call.sender_role === 'owner' ? 'Ajans Sahibi' : 'Asistan'}{call.room_name ? ` · ${call.room_name}` : ''}</p>
        </div>
      </div>
      {call.message && <p className="mt-2 break-words text-xs text-white/85">{call.message}</p>}
      <button type="button" onClick={onJoin} className="mt-3 h-10 w-full rounded-xl bg-[#FFD700] text-sm font-black text-black">Katıl</button>
    </div>
  );
}