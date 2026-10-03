import { useEffect, useRef, useState } from 'react';
import { Send, Smile } from 'lucide-react';
import EmojiPicker from '@/components/player/EmojiPicker';

/** Sohbet ikonuna basınca odanın altına düşen yazma alanı — liste açmaz, doğrudan klavyeyi açar. */
export default function VoiceChatOverlay({ onSend }) {
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    setEmojiOpen(false);
    onSend(value);
  };

  return (
    <div className="shrink-0">
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
    </div>
  );
}