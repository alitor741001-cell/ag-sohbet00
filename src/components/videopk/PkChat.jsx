import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Send, X } from 'lucide-react';
import VoiceChatMessage from '@/components/voice/VoiceChatMessage';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import usePkChat from '@/hooks/usePkChat';
import { useUserProfile } from '@/lib/profileCard';

/**
 * Görüntülü PK sohbeti: iki taraf yazar, herkes aynı akışı görür.
 * Panel tam ekran açılır; mesajlar klavye açılsa da görünür kalır ve panel kapanıp
 * açıldığında yazışma kaybolmaz. Her satırda seviye, VIP ve N rozetleri ile isim vardır;
 * profile dokununca sesli odadaki profil kartının aynısı açılır.
 */
export default function PkChat({ open, onClose, matchId, hostId, user, viewers = 0, readOnly = false }) {
  const { openUserProfile } = useUserProfile();
  const { messages, send, sending } = usePkChat(matchId);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  const userIds = useMemo(
    () => [...new Set(messages.map((message) => message.user_id).filter(Boolean))],
    [messages],
  );
  const profiles = useMessageProfiles(userIds);

  // Yeni mesaj geldiğinde akış en alta kayar.
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length, open]);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setText('');
    await send(value).catch(() => null);
  };

  return (
    <div className="fixed inset-0 z-[210] flex flex-col bg-[#120a18]">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-3">
        <p className="min-w-0 flex-1 text-[13.5px] font-black text-white">PK Sohbeti</p>
        <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-black text-white/80">
          <Eye className="h-3 w-3" /> {viewers}
        </span>
        <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-white/70 active:bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-2">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-[12px] text-white/45">Henüz mesaj yok. İlk mesajı sen yaz.</p>
        ) : messages.map((message) => (
          <VoiceChatMessage
            key={message.id}
            message={message}
            profile={profiles[message.user_id]}
            ownerId={hostId}
            currentUserId={user?.id}
            currentUserName={user?.username || ''}
            onOpenProfile={openUserProfile}
          />
        ))}
      </div>

      {readOnly ? (
        <p
          className="shrink-0 border-t border-white/10 px-3 py-2.5 text-center text-[11.5px] font-semibold text-white/50"
          style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
        >
          Yazışmayı okuyabilirsin; yazmak için PK turunun açık olması gerekir.
        </p>
      ) : (
        <form
          onSubmit={submit}
          className="flex shrink-0 items-center gap-1.5 border-t border-white/10 px-2.5 pt-2"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={300}
            placeholder="Mesaj yaz…"
            className="h-11 min-w-0 flex-1 rounded-full bg-white/8 px-4 text-[13px] text-white outline-none ring-1 ring-white/12 placeholder:text-white/35"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            aria-label="Gönder"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white active:scale-95 disabled:opacity-40"
            style={{ backgroundImage: 'linear-gradient(135deg,#ff2c93,#8b16d8)' }}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}