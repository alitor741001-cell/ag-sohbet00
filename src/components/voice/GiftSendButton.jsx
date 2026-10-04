/** Sağ altta duran yuvarlak gönder düğmesi — slottaki yeşil SPIN düğmesi işçiliği, üzerinde yalnızca "Gönder" yazar. */
export default function GiftSendButton({ visible, disabled, onSend }) {
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[250] flex justify-end px-5">
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