import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { getRoleInfo } from '@/lib/roles';
import { HIDDEN_AVATAR_URL, isHiddenName } from '@/lib/hiddenUser';

// Film odası sohbet satırı (referans tasarım): neon halkalı profil, renkli isim, sağda saat, koyu gri baloncuk.
// Özel sohbet düzeniyle aynı: kendi mesajım sağda ve renkli balonda, diğerleri solda.
const COLORS = ['#FFD700', '#8A5CFF', '#22C55E', '#FF4D6D', '#38BDF8', '#F97316'];

function RoomChatMessage({ message, profile, ownerId, currentUserId, canDelete, onDelete, onImage, onOpenProfile }) {
  const role = getRoleInfo(profile || message);
  const hidden = isHiddenName(message.user_name);
  const mine = !!currentUserId && message.user_id === currentUserId;
  const name = message.user_name || 'Kullanıcı';
  const avatar = hidden ? HIDDEN_AVATAR_URL : (profile?.avatar || message.user_avatar);
  const seed = [...String(message.user_id || name)].reduce((s, c) => s + c.charCodeAt(0), 0);
  const color = hidden ? '#FF4D6D' : message.user_id === ownerId ? '#FFD700' : (role.color || COLORS[seed % COLORS.length]);
  const time = message.created_date ? new Date(message.created_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
  return <article className={`group flex w-full min-w-0 shrink-0 items-start gap-2.5 ${mine ? 'flex-row-reverse text-right' : ''}`}>
    <button type="button" onClick={() => onOpenProfile?.(message.user_id)} aria-label={`${name} profilini aç`} className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-black" style={{ borderColor: color, boxShadow: `0 0 10px -2px ${color}` }}>
      {avatar ? <Image src={avatar} alt="" fittingType="fill" className="h-full w-full" /> : <span className="text-sm font-bold" style={{ color }}>{name.trim().charAt(0) || '?'}</span>}
    </button>
    <div className="min-w-0 flex-1">
      <div className={`flex items-center gap-2 ${mine ? 'justify-end' : ''}`}>
        {mine && time && <span className="shrink-0 text-[10px] text-white/45">{time}</span>}
        <button type="button" onClick={() => onOpenProfile?.(message.user_id)} className="min-w-0 truncate text-left text-xs font-bold" style={{ color }}>{name}</button>
        {!mine && time && <span className="ml-auto shrink-0 text-[10px] text-white/45">{time}</span>}
      </div>
      {message.file_url && <Image src={message.file_url} alt="Sohbet görseli" className={`mt-1 block h-40 w-40 max-w-full cursor-pointer rounded-xl ${mine ? 'ml-auto' : ''}`} fittingType="fit" onClick={() => onImage(message.file_url)} />}
      {message.text && <p className={`mt-1 inline-block max-w-full whitespace-pre-wrap break-words rounded-xl px-3 py-1.5 text-sm text-white [overflow-wrap:anywhere] ${mine ? 'border border-primary/45 bg-primary/25' : 'bg-[#232323]'}`}>{message.text}</p>}
    </div>
    {canDelete && <button onClick={() => onDelete(message.id)} className="shrink-0 self-center p-1 text-white/40 opacity-60 hover:text-[#FF4D5E] sm:opacity-0 sm:group-hover:opacity-100" aria-label="Mesajı sil"><Trash2 className="h-3.5 w-3.5" /></button>}
  </article>;
}
export default memo(RoomChatMessage);