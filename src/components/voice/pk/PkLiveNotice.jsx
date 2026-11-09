import { LogOut, Play, RotateCcw, Video, X } from 'lucide-react';

/**
 * Alt panelin üst satırı: maç başlamadan "Maçı Başlat", maç bittiğinde
 * "Maçtan ayrıl" ve "Rövanş" düğmeleri. Tek başına yayında düğmeler görünmez.
 */
export default function PkLiveNotice({
  started = false, finished = false, canStart = false, guestName = '', pendingName = '', expired = false,
  onStart, onLeave, onRematch, onCancel, rematchBusy = false, startBusy = false, cancelBusy = false,
}) {
  // Davet yanıtı beklenirken yalnızca iptal düğmesi görünür: kamera düzeni değişmez.
  const waiting = !started && !finished && (!!pendingName || expired);
  return (
    <div className="space-y-1">
      {finished ? (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onLeave}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-white/12 px-2.5 py-1.5 text-[10.5px] font-black text-white active:scale-95"
          >
            <LogOut className="h-3 w-3" /> Maçtan ayrıl
          </button>
          {onRematch && (
            <button
              type="button"
              onClick={onRematch}
              disabled={rematchBusy}
              className="flame-live flex shrink-0 items-center gap-1 rounded-lg border border-fuchsia-200/70 px-2.5 py-1.5 text-[10.5px] font-black text-white active:scale-95 disabled:opacity-50"
              style={{ backgroundImage: 'linear-gradient(115deg,#ffb3f0 0%,#d946ef 45%,#7c0ea0 100%)' }}
            >
              <RotateCcw className="h-3 w-3" /> Rövanş
            </button>
          )}
        </div>
      ) : !started && canStart ? (
        <button
          type="button"
          onClick={onStart}
          disabled={startBusy}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 text-[12px] font-black text-black active:scale-[0.99] disabled:opacity-50"
        >
          <Play className="h-4 w-4" /> Maçı Başlat (5 dk)
        </button>
      ) : (
        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1">
          <Video className="h-3 w-3 shrink-0 text-white/70" />
          <p className="min-w-0 flex-1 truncate text-[9.5px] font-semibold leading-snug text-white/70">
            {started
              ? 'PK maçı başladı! Yayıncına destek ol, hediye gönder.'
              : expired
                ? 'Davet zaman aşımına uğradı.'
                : pendingName
                  ? `${pendingName} daveti bekleniyor…`
                  : guestName
                    ? `${guestName} davetini kabul etti — tur başlıyor.`
                    : 'Görüntülü yayın açık. Rakip davet edebilirsin.'}
          </p>
          {waiting && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelBusy}
              className="flex shrink-0 items-center gap-1 rounded-md bg-white/12 px-2 py-1 text-[9.5px] font-black text-white/80 active:scale-95 disabled:opacity-50"
            >
              <X className="h-3 w-3" /> İptal
            </button>
          )}
        </div>
      )}
    </div>
  );
}