import { Send } from 'lucide-react';

/** Hediye kutusunun sağ alt köşesindeki küçük yuvarlak gönder düğmesi.
 *  Üstündeki sayaç (X1, X2…) bu turda kaç hediye gönderildiğini gösterir ve her
 *  gönderimde bir artar — seri gönderimde sayaç ilerler, düğme kaybolmaz. */
export default function GiftSendButton({ visible, disabled, count = 0, onSend }) {
  if (!visible) return null;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSend}
      aria-label="Hediyeyi gönder"
      className="slot-spin gift-send-corner relative flex h-14 w-14 items-center justify-center rounded-full text-black/80 touch-manipulation transition-transform active:scale-90 disabled:opacity-40"
    >
      <Send className="h-6 w-6" />
      {count > 0 && (
        <span
          key={count}
          className="number-pop absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-2 py-0.5 text-[11px] font-black tabular-nums text-white ring-1 ring-white/25"
        >
          X{count}
        </span>
      )}
    </button>
  );
}