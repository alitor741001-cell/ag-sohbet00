import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import VoiceChatMessage from '@/components/voice/VoiceChatMessage';
import { plainText } from '@/components/voice/voiceText';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useRoomLevels from '@/hooks/useRoomLevels';

/** Oda ekranındaki canlı sohbet akışı — panel açmadan son mesajlar görünür. */
export default function VoiceLiveFeed({ messages = [], ownerId, moderators = [], currentUserId, onOpenProfile, onOpenChat, className = '' }) {
  const recent = useMemo(() => messages.slice(-5), [messages]);
  const userIds = useMemo(
    () => recent.filter((message) => message.type !== 'system' && message.user_id).map((message) => message.user_id),
    [recent]
  );
  const profiles = useMessageProfiles(userIds);
  const { levels } = useRoomLevels(userIds);

  return (
    <div className={`mx-3 mb-2 flex shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/55 ${className}`}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-white/70">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Canlı akış
        </p>
        {onOpenChat && (
          <button type="button" onClick={onOpenChat} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/80 active:scale-95">
            Sohbeti aç
          </button>
        )}
      </div>
      <div className="max-h-[26vh] space-y-1.5 overflow-y-auto px-3 py-2">
        {recent.length === 0 && <p className="text-[11px] text-white/40">Henüz mesaj yok.</p>}
        {recent.map((message) => message.type === 'system'
          ? <p key={message.id} className="break-words text-center text-[11px] font-semibold italic text-amber-300 [overflow-wrap:anywhere]">{plainText(message.text)}</p>
          : <VoiceChatMessage
              key={message.id}
              message={message}
              profile={profiles[message.user_id]}
              level={levels[message.user_id]}
              ownerId={ownerId}
              moderators={moderators}
              currentUserId={currentUserId}
              onOpenProfile={onOpenProfile}
            />)}
      </div>
    </div>
  );
}