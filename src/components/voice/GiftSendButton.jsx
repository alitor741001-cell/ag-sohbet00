/** Sağ altta duran yuvarlak gönder düğmesi — slottaki yeşil SPIN düğmesi işçiliği, üzerinde yalnızca "Gönder" yazar. */
export default function GiftSendButton({ visible, disabled, onSend, count = 0 }) {
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed right-5 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[250] flex flex-col items-center gap-2">
      {count > 0 && <span aria-live="polite" className="rounded-full border border-slot-gold/60 bg-slot-panel px-3 py-1 text-lg font-black tabular-nums text-slot-gold">X{count}</span>}
      <button
        type="button"
        disabled={disabled}
        onClick={onSend}
        aria-label="Gönder"
        className="slot-spin pointer-events-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full text-[11px] font-black leading-none text-black/80 transition-transform active:scale-90 disabled:opacity-40"
      >
        Gönder
      </button>
    </div>
  );
}