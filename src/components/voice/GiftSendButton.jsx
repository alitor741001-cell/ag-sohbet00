import { Send } from 'lucide-react';

/** Hediye kutusunun sağ alt köşesindeki küçük yuvarlak gönder düğmesi. */
export default function GiftSendButton({ visible, disabled, onSend }) {
  if (!visible) return null;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSend}
      aria-label="Hediyeyi gönder"
      className="slot-spin gift-send-corner flex h-14 w-14 items-center justify-center rounded-full text-black/80 touch-manipulation transition-transform active:scale-90 disabled:opacity-40"
    >
      <Send className="h-6 w-6" />
    </button>
  );
}