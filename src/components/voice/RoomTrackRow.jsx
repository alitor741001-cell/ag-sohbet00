import { useRef, useState } from 'react';
import { Loader2, Music, Play, Trash2 } from 'lucide-react';

// Silme şeridi genişliği: satır tam olarak bu kadar sola kaydığında buton görünür.
const OPEN_X = -78;
// Bu mesafeden fazla kaydırma tıklama sayılmaz.
const SWIPE_SLOP = 6;

/**
 * Şarkı satırı: dokununca şarkı odada çalar, sola kaydırınca sağdan "Sil" butonu açılır.
 * Kaydırma dikey kaydırmayı engellemez; satır yalnızca yatay eksende kayar.
 */
export default function RoomTrackRow({ track, active, busy, onPlay, onDelete }) {
  const [open, setOpen] = useState(false);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const dxRef = useRef(0);
  const swiped = useRef(false);

  const apply = (value) => {
    dxRef.current = value;
    setDx(value);
  };

  const start = (event) => {
    drag.current = { x: event.clientX, base: open ? OPEN_X : 0 };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
  };

  const move = (event) => {
    if (!drag.current) return;
    const next = Math.min(0, Math.max(OPEN_X - 24, drag.current.base + (event.clientX - drag.current.x)));
    if (Math.abs(next - drag.current.base) > SWIPE_SLOP) swiped.current = true;
    apply(next);
  };

  const end = () => {
    if (!drag.current) return;
    const opened = dxRef.current <= OPEN_X / 2;
    setOpen(opened);
    apply(opened ? OPEN_X : 0);
    setDragging(false);
    drag.current = null;
  };

  // Kaydırma tıklaması şarkıyı açmaz; açık satıra dokunmak şeridi geri kapatır.
  const tap = () => {
    if (swiped.current) { swiped.current = false; return; }
    if (open) { setOpen(false); apply(0); return; }
    onPlay(track);
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#121212]">
      <button
        type="button"
        disabled={busy}
        onClick={() => onDelete(track)}
        className="absolute inset-y-0 right-0 flex w-[78px] flex-col items-center justify-center gap-0.5 bg-red-600 text-[10px] font-bold text-white active:brightness-110 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" /> Sil
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={tap}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        style={{ transform: `translateX(${dx}px)`, touchAction: 'pan-y' }}
        className={`relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left disabled:opacity-60 ${active ? 'bg-[#2e2607]' : 'bg-[#121212]'} ${dragging ? '' : 'transition-transform duration-200'}`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? 'bg-[#FFD700] text-black' : 'bg-white/10 text-white'}`}>
          {active ? <Music className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{track.title || 'Şarkı'}</span>
          <span className="block truncate text-[10px] text-white/45">
            {active ? 'Şu an odada çalıyor' : 'Dokununca odada çalar'}
          </span>
        </span>
        {busy && active && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/60" />}
      </button>
    </div>
  );
}