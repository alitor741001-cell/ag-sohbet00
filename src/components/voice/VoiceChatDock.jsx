import { useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Send, Smile, Trophy } from 'lucide-react';
import EmojiPicker from '@/components/player/EmojiPicker';
import VoiceChatMessage from '@/components/voice/VoiceChatMessage';
import VoiceGiftMessage from '@/components/voice/VoiceGiftMessage';
import SlotWinMessage from '@/components/games/SlotWinMessage';
import BigGiftChatNotice from '@/components/voice/BigGiftChatNotice';
import { plainText } from '@/components/voice/voiceText';
import { LEVEL_UP_TONE, levelUpName, parseLevelUpNotice } from '@/lib/levelUpNotice';
import useMessageProfiles from '@/hooks/useMessageProfiles';

/**
 * Oda alt bölümü: sohbet akışı (geçmiş dahil) odaya girildiği anda kendiliğinden görünür.
 * Klavye (sohbet) butonu yalnızca yazma alanını açar; mesaj gönderilince yazma alanı kapanır ve
 * klavye iner, akış görünür kalır. Klavye açıkken yazma alanı klavyenin üstüne kayar — odanın
 * geri kalanı ve alttaki kontrol çubuğu yerinden oynamaz.
 */
export default function VoiceChatDock({ messages = [], onSend, open, onCloseComposer, composerOpen, chatLocked, currentUserId, ownerId, moderators = [], onOpenProfile, bigGiftNotice, onOpenBigGiftRoom, levels = {}, hiddenUsers = {}, bottomInset = 0 }) {
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

  // Geçmiş dahil tüm akış butona basmadan görünür; metinsiz sistem işaretleri atlanır.
  const visible = messages.filter((message) => message.type !== 'system' || plainText(message.text));

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
    <div className="relative shrink-0" style={{ paddingBottom: composerOpen ? bottomInset : 0 }}>
      {(visible.length > 0 || !!bigGiftNotice) && (
        <div
          style={{ touchAction: 'pan-y' }}
          className={`${composerOpen ? 'max-h-[16vh]' : open ? 'max-h-[30vh]' : 'max-h-[22vh]'} shrink-0 overflow-y-auto overscroll-contain pb-1 [mask-image:linear-gradient(to_bottom,transparent,black_14%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_14%)]`}
        >
          <div className="flex flex-col gap-1.5 px-4">
            {visible.map((message) => {
              if (message.type === 'slot_win') {
                return <SlotWinMessage key={message.id} message={message} />;
              }
              if (message.type === 'gift') {
                return <VoiceGiftMessage key={message.id} message={message} />;
              }
              if (message.type === 'system') {
                // Seviye atlama: atış seviyesi hediye ikonu (kehribar), hediye alma seviyesi kupa (mavi).
                const levelUp = parseLevelUpNotice(message.text);
                if (levelUp) {
                  return (
                    <p key={message.id} className="flex flex-wrap items-center justify-center gap-1 break-words px-2 text-center text-[11px] font-semibold [overflow-wrap:anywhere]">
                      <span className="text-white/90">{levelUpName(plainText(message.text))}</span>
                      {levelUp.kind === 'received'
                        ? <Trophy className={`h-3.5 w-3.5 ${LEVEL_UP_TONE.received}`} />
                        : <Gift className={`h-3.5 w-3.5 ${LEVEL_UP_TONE.sent}`} />}
                      <span className={`font-black tabular-nums ${LEVEL_UP_TONE[levelUp.kind]}`}>{levelUp.level}</span>
                      <span className="text-white/70">lvl atladı</span>
                    </p>
                  );
                }
                return <p key={message.id} className="break-words px-2 text-center text-[11px] font-semibold italic text-amber-300 [overflow-wrap:anywhere] [text-shadow:0_0_10px_rgba(251,191,36,0.45)]">{plainText(message.text)}</p>;
              }
              return (
                <VoiceChatMessage
                  key={message.id}
                  message={message}
                  level={levels[message.user_id] || levels[hiddenUsers[message.user_name]] || 0}
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
            className="mx-3 mb-2 mt-1.5 flex items-center gap-1 rounded-full border border-[#FFD700]/45 bg-black/70 px-3 py-1.5 shadow-[0_0_16px_-6px_rgba(255,215,0,0.85)] backdrop-blur-md"
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FFD700] bg-[#FFD700] text-black shadow-[0_0_14px_-3px_rgba(255,215,0,0.95)] transition-transform active:scale-95"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}