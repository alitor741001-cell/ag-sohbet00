import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Gift, Trophy } from 'lucide-react';
import EmojiPicker from '@/components/player/EmojiPicker';
import VoiceChatMessage from '@/components/voice/VoiceChatMessage';
import VoiceChatNeonComposer from '@/components/voice/VoiceChatNeonComposer';
import VoiceGiftMessage from '@/components/voice/VoiceGiftMessage';
import SlotWinMessage from '@/components/games/SlotWinMessage';
import BigGiftChatNotice from '@/components/voice/BigGiftChatNotice';
import { plainText } from '@/components/voice/voiceText';
import { LEVEL_UP_TONE, levelUpName, parseLevelUpNotice } from '@/lib/levelUpNotice';
import isQuietNotice from '@/lib/roomNotices';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useFollowMessages from '@/hooks/useFollowMessages';

/**
 * Oda alt bölümü: sohbet akışı (geçmiş dahil) odaya girildiği anda kendiliğinden görünür.
 * Klavye (sohbet) butonu yalnızca yazma alanını açar; mesaj gönderilince yazma alanı kapanır ve
 * klavye iner, akış görünür kalır. Klavye açıkken oda alt bloğu (bu akış + kontrol çubuğu) tek
 * parça hâlinde klavyenin üstüne kayar; oda yerleşimi yeniden akışa girmez.
 */
export default function VoiceChatDock({ messages = [], onSend, open, onCloseComposer, composerOpen, keyboardOpen = false, chatLocked, currentUserId, currentUserName = '', ownerId, moderators = [], onOpenProfile, onMention, bigGiftNotices = [], onOpenBigGiftRoom, hiddenUsers = {}, mention = null }) {
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const { onScroll, onContentLoad, followLatest } = useFollowMessages(scrollRef, messages, currentUserId);
  const blurTimerRef = useRef(0);
  useEffect(() => () => window.clearTimeout(blurTimerRef.current), []);
  const sendingRef = useRef(false);
  const [sending, setSending] = useState(false);

  // Gizli kullanıcının mesajı kimliksiz yazılır: N/VIP rozetleri için takma ad → kimlik eşlemesi kullanılır.
  const userIds = useMemo(
    () => [...messages.filter((message) => message.type !== 'system' && message.user_id).map((message) => message.user_id), ...Object.values(hiddenUsers)],
    [messages, hiddenUsers]
  );
  const profiles = useMessageProfiles(userIds);

  // Geçmiş dahil tüm akış butona basmadan görünür; metinsiz sistem işaretleri atlanır.
  // Hediye, müzik, odadan ayrılma, koltuk ve mikrofon işlemleri bildirim alanında görünmez.
  const visible = useMemo(() => messages.filter((message) => !isQuietNotice(message) && (message.type !== 'system' || plainText(message.text))), [messages]);

  useLayoutEffect(() => {
    if (composerOpen) inputRef.current?.focus({ preventScroll: true });
    // Sohbet kapanınca emoji paneli de kapanır: alan her açılışta temiz görünür.
    else setEmojiOpen(false);
  }, [composerOpen]);

  // "Bahset": profil kartındaki düğme kişiyi yazma alanına @isim olarak ekler.
  useEffect(() => {
    if (!mention?.name) return;
    setText((prev) => {
      const tag = `@${mention.name} `;
      if (prev.includes(tag)) return prev;
      return prev && !prev.endsWith(' ') ? `${prev} ${tag}` : `${prev}${tag}`;
    });
  }, [mention?.at, mention?.name]);

  // Klavye açıldıktan sonra kendiliğinden kapanırsa (bir panel açılınca, geri hareketiyle ya da
  // klavye indirilince) yazma alanı da kapanır: ekranda boş bir yazma çubuğu takılı kalmaz.
  // Emoji paneli açıkken kapanmaz; emoji seçilirken alan yerinde kalır.
  const keyboardWasOpen = useRef(false);
  const emojiOpenRef = useRef(false);
  emojiOpenRef.current = emojiOpen;
  const closeComposerRef = useRef(onCloseComposer);
  closeComposerRef.current = onCloseComposer;

  useEffect(() => {
    if (keyboardOpen) { keyboardWasOpen.current = true; return; }
    if (!keyboardWasOpen.current) return;
    keyboardWasOpen.current = false;
    if (!emojiOpenRef.current) closeComposerRef.current?.();
  }, [keyboardOpen]);

  useEffect(onContentLoad, [bigGiftNotices.map(notice => notice.id).join(','), onContentLoad]);

  // Yazma alanı odaktan çıkınca (klavye kapandığında, ekranda başka bir yere dokunulduğunda)
  // kendiliğinden kapanır — iOS ve Android'de aynı davranış. Emoji seçilirken açık kalır.
  const handleInputBlur = () => {
    window.clearTimeout(blurTimerRef.current);
    blurTimerRef.current = window.setTimeout(() => {
      if (emojiOpenRef.current) return;
      if (document.activeElement === inputRef.current) return;
      closeComposerRef.current?.();
    }, 160);
  };

  const submit = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || sendingRef.current) return;
    sendingRef.current = true; setSending(true);
    setText('');
    setEmojiOpen(false);
    // Gönderince yazma alanı ve klavye kapansın; mesaj akışı açık kalır.
    inputRef.current?.blur();
    onCloseComposer?.();
    followLatest();
    try { await onSend(value); }
    finally { sendingRef.current = false; setSending(false); }
  };

  return (
    <div className="relative flex h-full min-h-0 shrink-0 flex-col justify-end">
      {(visible.length > 0 || bigGiftNotices.length > 0) && (
        <div
          ref={scrollRef}
          onScroll={onScroll}
          onLoadCapture={onContentLoad}
          style={{ touchAction: 'pan-y' }}
          className={`voice-chat-flow ${composerOpen ? 'max-h-[16vh]' : open ? 'max-h-[30vh]' : 'max-h-[22vh]'} shrink-0 overflow-y-auto overscroll-contain pb-0 [mask-image:linear-gradient(to_bottom,transparent,black_14%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_14%)]`}
        >
          <div className="flex flex-col gap-1.5 pl-0.5 pr-4">
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
                return <p key={message.id} onClick={() => onOpenProfile?.(message.user_id)} className="cursor-pointer break-words px-2 text-center text-[11px] font-semibold italic text-amber-300 [overflow-wrap:anywhere] [text-shadow:0_0_10px_rgba(251,191,36,0.45)]">{plainText(message.text)}</p>;
              }
              return (
                <VoiceChatMessage
                  key={message.id}
                  message={message}
                  profile={profiles[message.user_id] || profiles[hiddenUsers[message.user_name]]}
                  ownerId={ownerId}
                  moderators={moderators}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  onMention={onMention}
                  onOpenProfile={onOpenProfile}
                />
              );
            })}
            {bigGiftNotices.map(notice => <BigGiftChatNotice key={notice.id} notice={notice} onOpen={() => onOpenBigGiftRoom?.(notice)} />)}
            <div aria-hidden="true" />
          </div>
        </div>
      )}

      {open && chatLocked && (
        <p className="mx-3 mb-2 mt-1.5 rounded-full border border-primary/50 bg-black/60 px-4 py-3 text-center text-[11px] font-semibold text-primary backdrop-blur-md">
          Sohbet yasağı var — yazmak için bir koltuğa otur.
        </p>
      )}

      {composerOpen && !chatLocked && (
        <div className="relative shrink-0">
          {/* Emoji paneli yazma alanının üstüne açılır: sohbet alanının yüksekliğini sıkıştırmaz. */}
          {emojiOpen && (
            <div className="absolute bottom-full left-3 right-3 z-30 mb-1 max-h-[40vh] overflow-y-auto rounded-2xl border border-[#00e5ff]/35 bg-[#050515]/95 shadow-[0_0_18px_rgba(0,229,255,0.28)] backdrop-blur-md">
              <EmojiPicker
                onSelect={(emoji) => {
                  setText((prev) => prev + emoji);
                  inputRef.current?.focus({ preventScroll: true });
                }}
              />
            </div>
          )}

          <VoiceChatNeonComposer
            text={text}
            onChange={(event) => setText(event.target.value)}
            onSubmit={submit}
            onBlur={handleInputBlur}
            inputRef={inputRef}
            emojiOpen={emojiOpen}
            onToggleEmoji={() => setEmojiOpen((value) => !value)}
            sending={sending}
          />
        </div>
      )}
    </div>
  );
}