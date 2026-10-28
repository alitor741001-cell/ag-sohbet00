import { Send, Smile } from 'lucide-react';

/**
 * Sesli oda sohbet yazma alanı: neon kapsül tasarım.
 * Zemin saydamdır (beyaz arka plan yok); odanın görseli kapsülün altından görünür.
 */
export default function VoiceChatNeonComposer({ text, onChange, onSubmit, onBlur, inputRef, emojiOpen, onToggleEmoji, sending }) {
  return (
    <form
      onSubmit={onSubmit}
      className="voice-chat-composer voice-neon-composer mx-3 mb-2 mt-1.5 flex items-center gap-2 rounded-full px-2 py-1.5"
    >
      <button
        type="button"
        onClick={onToggleEmoji}
        aria-label="Emoji ekle"
        className={`voice-neon-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-white transition-transform active:scale-95 ${emojiOpen ? 'is-active' : ''}`}
      >
        <Smile className="h-5 w-5" strokeWidth={1.6} />
      </button>

      <input
        ref={inputRef}
        value={text}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="Mesajınızı yazın..."
        autoComplete="off"
        enterKeyHint="send"
        className="h-10 min-w-0 flex-1 bg-transparent px-1 text-base text-white outline-none placeholder:text-white/55"
      />

      <button
        type="submit"
        disabled={sending || !text.trim()}
        aria-label="Gönder"
        className="voice-neon-send flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-transform active:scale-95 disabled:opacity-40"
      >
        <Send className="h-5 w-5" strokeWidth={1.8} />
      </button>
    </form>
  );
}