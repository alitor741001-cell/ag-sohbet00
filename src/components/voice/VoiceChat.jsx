import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Smile } from 'lucide-react';
import EmojiPicker from '@/components/player/EmojiPicker';
import VoiceChatMessage from '@/components/voice/VoiceChatMessage';
import { plainText } from '@/components/voice/voiceText';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useRoomLevels from '@/hooks/useRoomLevels';

/** Sesli oda sohbet akışı — rozetli sohbet satırları, oda bildirimleri altın sistem mesajı. */
export default function VoiceChat({ messages = [], onSend, currentUserId, ownerId, moderators = [], onOpenProfile, className = '' }) {
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const endRef = useRef(null);

  const userIds = useMemo(
    () => messages.filter((message) => message.type !== 'system' && message.user_id).map((message) => message.user_id),
    [messages]
  );
  const profiles = useMessageProfiles(userIds);
  const { levels } = useRoomLevels(userIds);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const submit = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    setEmojiOpen(false);
    onSend(value);
  };

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.length === 0 && <p className="py-6 text-center text-xs text-white/40">Henüz mesaj yok.</p>}
        {messages.map((message) => message.type === 'system'
          ? <p key={message.id} className="break-words px-2 text-center text-xs font-semibold italic text-amber-300 [overflow-wrap:anywhere] [text-shadow:0_0_10px_rgba(251,191,36,0.45)]">{plainText(message.text)}</p>
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
        <div ref={endRef} />
      </div>

      {emojiOpen && <EmojiPicker onSelect={(emoji) => setText((prev) => prev + emoji)} />}

      <form onSubmit={submit} className="flex shrink-0 items-center gap-1 border-t border-white/10 bg-white px-3 py-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Selam..."
          className="h-10 min-w-0 flex-1 bg-transparent px-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        <button
          type="button"
          onClick={() => setEmojiOpen((value) => !value)}
          aria-label="Emoji ekle"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 ${emojiOpen ? 'bg-neutral-900/10 text-neutral-900' : 'text-neutral-500'}`}
        >
          <Smile className="h-5 w-5" />
        </button>
        <button type="submit" aria-label="Gönder" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-transform active:scale-95">
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}