import { Music } from 'lucide-react';

/**
 * Köşedeki müzik çemberi: plak görünümü, parmakla taşınır, dokununca panel açılır.
 * Açılma, dokunuş bırakıldığında yapılır — Android tarayıcılarda tıklama olayı her zaman gelmez.
 */
export default function MusicControllerBubble({ pos, playing, bind, onOpen, didDrag }) {
  return (
    <button
      type="button"
      aria-label="Müzik denetleyicisini aç"
      {...bind}
      onPointerUp={() => { if (!didDrag()) onOpen(); }}
      onClick={() => { if (!didDrag()) onOpen(); }}
      className="fixed z-[205] flex h-14 w-14 touch-none items-center justify-center rounded-full border-2 border-white/85 bg-black shadow-[0_8px_24px_rgba(0,0,0,0.75)] transition-transform active:scale-95"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Plak: ince oluklar, şarkı çalarken yavaşça döner. */}
      <span
        className="absolute inset-[5px] rounded-full"
        style={{
          background: 'repeating-radial-gradient(circle, #2a2a2a 0 1.5px, #0a0a0a 1.5px 3px)',
          animation: playing ? 'frame-rotate 7s linear infinite' : 'none',
        }}
      />
      {/* Merkez etiket: nota */}
      <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
        <Music className="h-3.5 w-3.5" />
      </span>
      {/* Pikap kolu */}
      <span className="absolute right-[6px] top-[6px] h-3.5 w-[2px] origin-top rotate-[38deg] rounded-full bg-white/85" />
      {/* Kenardaki beyaz ışık */}
      <span className="absolute -right-0.5 top-1 h-2 w-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
    </button>
  );
}