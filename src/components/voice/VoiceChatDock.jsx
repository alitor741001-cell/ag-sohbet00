import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Smile } from 'lucide-react';
import EmojiPicker from '@/components/player/EmojiPicker';
import VoiceChatMessage from '@/components/voice/VoiceChatMessage';
import VoiceGiftMessage from '@/components/voice/VoiceGiftMessage';
import SlotWinMessage from '@/components/games/SlotWinMessage';
import BigGiftChatNotice from '@/components/voice/BigGiftChatNotice';
import { plainText } from '@/components/voice/voiceText';
import useMessageProfiles from '@/hooks/useMessageProfiles';

/**
 * Oda alt bölümü: sohbet (klavye) butonuna basınca mesaj akışı ve yazma alanı açılır.
 * Mesaj gönderilince yazma alanı kapanır ve klavye iner; mesaj akışı görünür kalır.
 */
export default function VoiceChatDock({ messages = [], onSend, open, onCloseComposer, composerOpen, chatLocked, currentUserId, ownerId, moderators = [], onOpenProfile, bigGiftNotice, onOpenBigGiftRoom, hiddenUsers = {} }) {
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  // Gizli kullanıcının mesajı kimliksiz yazılır: N/VIP rozetleri için takma ad → kimlik eşlemesi kullanılır.
  const userIds = useMemo(
    () => [...messages.filter((message) => message.type !== 'system' && message.user_id).map((message) => message.user_id), ...Object.values(hiddenUsers)],
    [messages, hiddenUsers]
  );
  const profiles = useMessageProfiles(userIds);

  useEffect(() => {
    if (composerOpen) inputRef.current?.focus();
    // Sohbet kapanınca emoji paneli de kapanır: alan her açılışta temiz görünür.
    else setEmojiOpen(false);
  }, [composerOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, bigGiftNotice?.id]);

  const submit = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    setEmojiOpen(false);
    // Gönderince yazma alanı ve klavye kapansın; mesaj akışı açık kalır.
    inputRef.current?.blur();
    onSend(value);
    onCloseComposer?.();
  };

  return (
    <div className="relative shrink-0">
      {open && (messages.length > 0 || !!bigGiftNotice) && (
        <div className="absolute inset-x-0 bottom-full z-10 flex max-h-[34vh] flex-col justify-end overflow-y-auto overscroll-contain pb-1 [mask-image:linear-gradient(to_bottom,transparent,black_14%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_14%)]">
          <div className="flex flex-col gap-1.5 px-4">
            {messages.map((message) => {
              if (message.type === 'slot_win') {
                return <SlotWinMessage key={message.id} message={message} />;
              }
              if (message.type === 'gift') {
                return <VoiceGiftMessage key={message.id} message={message} />;
              }
              if (message.type === 'system') {
                return <p key={message.id} className="break-words px-2 text-center text-[11px] font-semibold italic text-amber-300 [overflow-wrap:anywhere] [text-shadow:0_0_10px_rgba(251,191,36,0.45)]">{plainText(message.text)}</p>;
              }
              return (
                <VoiceChatMessage
                  key={message.id}
                  message={message}
                  profile={profiles[message.user_id] || profiles[hiddenUsers[message.user_name]]}
                  ownerId={ownerId}
                  moderators={moderators}
                  currentUserId={currentUserId}
                  onOpenProfile={onOpenProfile}
                />
              );
            })}
            {bigGiftNotice && <BigGiftChatNotice notice={bigGiftNotice} onOpen={onOpenBigGiftRoom} />}
            <div ref={endRef} />
          </div>
        </div>
      )}

      {open && chatLocked && (
        <p className="mx-3 mb-2 mt-1.5 rounded-full border border-primary/50 bg-black/60 px-4 py-3 text-center text-[11px] font-semibold text-primary backdrop-blur-md">
          Sohbet yasağı var — yazmak için bir koltuğa otur.
        </p>
      )}

      {composerOpen && !chatLocked && (
        <>
          {emojiOpen && (
            <div className="mx-3 mb-1 overflow-hidden rounded-2xl border border-white/10">
              <EmojiPicker onSelect={(emoji) => setText((prev) => prev + emoji)} />
            </div>
          )}

          <form
            onSubmit={submit}
            className="mx-3 mb-2 mt-1.5 flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 backdrop-blur-md"
          >
            <input
              ref={inputRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Selam…"
              autoComplete="off"
              enterKeyHint="send"
              className="h-10 min-w-0 flex-1 bg-transparent px-1 text-base text-white outline-none placeholder:text-white/45"
            />
            <button
              type="button"
              onClick={() => setEmojiOpen((value) => !value)}
              aria-label="Emoji ekle"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 ${emojiOpen ? 'bg-white/20 text-white' : 'text-white/60'}`}
            >
              <Smile className="h-5 w-5" />
            </button>
            <button
              type="submit"
              aria-label="Gönder"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}