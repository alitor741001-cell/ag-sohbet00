import { memo } from 'react';
import { Check, CheckCheck, Gift, Trash2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import RoleMessageEffect from '@/components/role/RoleMessageEffect';
import AgencyInviteCard from '@/components/agency/AgencyInviteCard';
import { parseInviteMarker } from '@/lib/agency';
import RoomShareCard from '@/components/friends/RoomShareCard';
import { parseRoomShareMarker } from '@/lib/roomShare';

import NeonMessageCard from '@/components/friends/NeonMessageCard';

function ChatMessageItem({ message, userId, isAdmin, ownRole, friendRole, onDelete, onImage, ownGender, friendGender, ownName, friendName, ownAvatar, friendAvatar }) {
  const sent = message.sender_id === userId;
  const share = parseRoomShareMarker(message.content);
  const invite = parseInviteMarker(message.content);
  // Silme düğmesi yazanın profilinin üstüne gelmesin: kendi mesajımda sola alınır.
  const deleteButton = (sent || isAdmin) ? <button type="button" onClick={() => onDelete(message.id)} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center p-1 text-muted-foreground/70 opacity-60 hover:text-destructive focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100" title="Sil" aria-label="Mesajı sil"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" /></button> : null;
  return (
    <div data-message-id={message.id} className={`group flex items-end gap-1.5 ${sent ? 'justify-end' : 'justify-start'}`}>
      {sent && deleteButton}
      <RoleMessageEffect roleKey={sent ? ownRole : friendRole} className="min-w-0 w-[88%]">
        <NeonMessageCard
          mirrored={sent}
          plain
          gender={sent ? ownGender : friendGender}
          name={sent ? ownName : (friendName || message.sender_name)}
          avatar={sent ? ownAvatar : friendAvatar}
          time={new Date(message.created_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          footer={sent ? ((message.read_by || []).includes(message.receiver_id) ? <><CheckCheck className="h-3.5 w-3.5" />Görüldü</> : <><Check className="h-3.5 w-3.5" />Gönderildi</>) : null}
        >
          {message.file_url && <Image src={message.file_url} alt="foto" className="mb-1 h-48 w-48 max-w-full cursor-pointer rounded-lg" fittingType="fit" onClick={() => onImage(message.file_url)} />}
          {invite ? <AgencyInviteCard inviteId={invite} /> : share ? <RoomShareCard roomId={share.roomId} voice={share.voice} senderName={message.sender_name} /> : message.content && <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.content}</p>}
          {message.gift_coins > 0 && <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#f2ce6b]"><Gift className="h-3 w-3" />{message.gift_coins} coins hediye</p>}
        </NeonMessageCard>
      </RoleMessageEffect>
      {!sent && deleteButton}
    </div>
  );
}
export default memo(ChatMessageItem);