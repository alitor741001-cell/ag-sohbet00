import { CheckCheck, Headset } from 'lucide-react';
import { Image } from '@/components/ui/image';
import SupportAttachment from '@/components/support/SupportAttachment';

// Özel sohbetle aynı düzen: kendi mesajım sağda (renkli balon), karşı taraf solda
// (avatar + isim). Görüşmeyi üye de yetkili de aynı şekilde okur.
export default function SupportChatMessage({ message, viewer = 'user', memberName = 'Üye', memberAvatar, onImageClick }) {
  const fromStaff = message.sender === 'admin';
  const mine = viewer === 'admin' ? fromStaff : !fromStaff;
  const time = message.created_date ? new Date(message.created_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
  const avatar = fromStaff
    ? <span className="support-chat-logo !h-9 !w-9"><Headset className="h-5 w-5" /></span>
    : memberAvatar
      ? <Image src={memberAvatar} alt={memberName} className="support-ticket-avatar" />
      : <span className="support-ticket-avatar flex items-center justify-center text-xs font-bold">{memberName[0]}</span>;
  return <div className={`support-message ${mine ? 'is-mine' : ''}`}>
    {!mine && avatar}
    <div className="min-w-0 max-w-[78%]">
      {!mine && <p className="support-chat-muted mb-1 text-[11px]">{fromStaff ? 'Canlı Destek' : memberName}</p>}
      <div className="support-message-bubble"><SupportAttachment message={message} onImageClick={onImageClick} className="mb-1 max-h-48 max-w-full rounded-lg" />{message.text && <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>}
        <div className="support-message-time"><time>{time}</time>{mine && <CheckCheck className="h-3.5 w-3.5" aria-label="Gönderildi" />}</div>
      </div>
    </div>
  </div>;
}