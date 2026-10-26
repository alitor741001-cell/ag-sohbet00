import { Check } from 'lucide-react';
import NeonMessageCard from '@/components/friends/NeonMessageCard';
import SupportAttachment from '@/components/support/SupportAttachment';

// Özel sohbetle aynı düzen: kendi mesajım sağda (renkli balon), karşı taraf solda
// (avatar + isim). Görüşmeyi üye de yetkili de aynı şekilde okur.
export default function SupportChatMessage({ message, viewer = 'user', memberName = 'Üye', memberAvatar, memberGender, onImageClick }) {
  const fromStaff = message.sender === 'admin';
  const mine = viewer === 'admin' ? fromStaff : !fromStaff;
  const time = message.created_date ? new Date(message.created_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
  return <div className={`mb-4 flex ${mine ? 'justify-end' : 'justify-start'}`}>
    <div className="w-[88%] min-w-0">
      <NeonMessageCard
        gender={message.sender_gender || (!fromStaff ? memberGender : undefined)}
        name={fromStaff ? 'Canlı Destek' : (message.sender_name || memberName)}
        avatar={fromStaff ? undefined : (message.sender_avatar || memberAvatar)}
        time={time}
        footer={mine ? <><Check className="h-3.5 w-3.5" />Gönderildi</> : null}
      >
        <SupportAttachment message={message} onImageClick={onImageClick} className="mb-1 max-h-48 max-w-full rounded-lg" />
        {message.text && <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.text}</p>}
      </NeonMessageCard>
    </div>
  </div>;
}