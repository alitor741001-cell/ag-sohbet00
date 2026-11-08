import { useState } from 'react';
import { Gift, Send, SlidersHorizontal, Smile } from 'lucide-react';

const EMOJIS = ['❤️', '🔥', '😂', '👏'];

/** Alt yazı alanı: yorum yazılır; gül ve hediye düğmeleriyle birlikte sağ altta
 *  tek kare düğme durur — basınca kamera, mikrofon ve davet paneli açılır (yalnız oda sahibi). */
export default function PkActionBar({ onSend, onRose, onGift, onOpenControls, disabled }) {
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

      <form onSubmit={submit} className="flex items-end gap-1">
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

        {/* Sağ alt köşe: tek kare düğme — açtığı panelde kamera, mikrofon ve davet durur. */}
        {onOpenControls && (
          <button
            type="button"
            onClick={onOpenControls}
            aria-label="Yayın kontrolleri"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/12 text-white active:scale-95"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  );
}