import { useState } from 'react';
import { Gift, Send, Share2, Smile, Users } from 'lucide-react';

const EMOJIS = ['❤️', '🔥', '😂', '👏'];

/** Alt yazı alanı: yorum yazılır, emoji, davet, gül, hediye ve paylaş düğmeleri bulunur. */
export default function PkActionBar({ onSend, onInvite, onRose, onGift, onShare, shareCount = 0, disabled }) {
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    setEmojiOpen(false);
    onSend?.(value);
  };

  const iconClass = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white active:scale-95';

  return (
    <div className="shrink-0 pt-1">
      {emojiOpen && (
        <div className="mb-1 flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setText((current) => `${current}${emoji}`)}
              className="text-lg leading-none active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-1">
        <div className="flex h-9 min-w-0 flex-1 items-center rounded-full bg-white/12 pl-3 pr-1">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={disabled}
            placeholder="Yazın…"
            className="h-full min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-white/40 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setEmojiOpen((current) => !current)}
            aria-label="Emoji"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 active:scale-95"
          >
            <Smile className="h-4 w-4" />
          </button>
          {text.trim() && (
            <button type="submit" aria-label="Gönder" className="flex h-7 w-7 shrink-0 items-center justify-center text-[#fe2c55]">
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onInvite}
          aria-label="Arkadaş davet et"
          className={iconClass}
          style={{ background: 'linear-gradient(135deg,#fe2c55,#25f4ee)' }}
        >
          <Users className="h-4 w-4" />
        </button>
        <button type="button" onClick={onRose} aria-label="Gül gönder" className={iconClass}>
          <span className="text-lg leading-none">🌹</span>
        </button>
        <button
          type="button"
          onClick={onGift}
          aria-label="Hediye gönder"
          className={`${iconClass} text-[#fe2c55]`}
        >
          <Gift className="h-5 w-5" />
        </button>
        <button type="button" onClick={onShare} aria-label="Paylaş" className={`${iconClass} text-white`}>
          <Share2 className="h-4 w-4" />
          {shareCount > 0 && <span className="ml-0.5 text-[9.5px] font-black tabular-nums">{shareCount}</span>}
        </button>
      </form>
    </div>
  );
}