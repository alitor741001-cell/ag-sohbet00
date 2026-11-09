import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Send, X } from 'lucide-react';
import VoiceChatMessage from '@/components/voice/VoiceChatMessage';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import usePkChat from '@/hooks/usePkChat';
import { useUserProfile } from '@/lib/profileCard';

/**
 * Görüntülü PK sohbeti: iki taraf yazar, herkes aynı akışı görür.
 * Her satırda seviye (LVL), VIP ve N rozetleri ile isim vardır; profile dokununca
 * sesli odadaki profil kartının aynısı açılır.
 */
export default function PkChat({ open, onClose, matchId, hostId, user, viewers = 0 }) {
  const { openUserProfile } = useUserProfile();
  const { messages, send, sending } = usePkChat(matchId, open);
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
    <div className="fixed inset-0 z-[210] flex flex-col justify-end">
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="animate-sheet-up relative flex h-[64vh] w-full flex-col overflow-hidden rounded-t-[26px] bg-[#120a18]/97 ring-1 ring-fuchsia-400/25"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex shrink-0 items-center gap-2 px-4 pb-1.5 pt-3.5">
          <p className="min-w-0 flex-1 text-[13px] font-black text-white">PK Sohbeti</p>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-black text-white/80">
            <Eye className="h-3 w-3" /> {viewers}
          </span>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-white/60 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 pb-2">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-[11.5px] text-white/45">Henüz mesaj yok. İlk mesajı sen yaz.</p>
          ) : messages.map((message) => (
            <VoiceChatMessage
              key={message.id}
              message={message}
              profile={profiles[message.user_id]}
              ownerId={hostId}
              currentUserId={user?.id}
              currentUserName={user?.full_name || ''}
              onOpenProfile={openUserProfile}
            />
          ))}
        </div>

        {matchId ? (
          <form onSubmit={submit} className="flex shrink-0 items-center gap-1.5 border-t border-white/10 px-2.5 py-2">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={300}
              placeholder="Mesaj yaz…"
              className="h-10 min-w-0 flex-1 rounded-full bg-white/8 px-3.5 text-[12px] text-white outline-none ring-1 ring-white/12 placeholder:text-white/35"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              aria-label="Gönder"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white active:scale-95 disabled:opacity-40"
              style={{ backgroundImage: 'linear-gradient(135deg,#ff2c93,#8b16d8)' }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <p className="shrink-0 border-t border-white/10 px-3 py-2.5 text-center text-[11px] font-semibold text-white/50">
            Sohbet, PK turu başladığında açılır.
          </p>
        )}
      </div>
    </div>
  );
}