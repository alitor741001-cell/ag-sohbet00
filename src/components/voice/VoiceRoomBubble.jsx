import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Radio } from 'lucide-react';

/** Küçültülmüş oda: sağ altta sürüklenebilir balon, dokununca odaya döner. */
export default function VoiceRoomBubble({ name, muted, onOpen }) {
  const bounds = useRef(null);
  const moved = useRef(false);
  return (
    <div ref={bounds} className="pointer-events-none fixed inset-x-3 top-3 z-[240]" style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
      <motion.button
        type="button"
        drag
        dragConstraints={bounds}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => { moved.current = true; }}
        onPointerDown={() => { moved.current = false; }}
        onClick={() => { if (!moved.current) onOpen(); }}
        aria-label="Odaya dön"
        className="pointer-events-auto absolute bottom-0 right-0 flex max-w-[14rem] touch-none items-center gap-2 rounded-full border border-primary/60 bg-card/95 py-2 pl-2 pr-3.5 shadow-2xl"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
          <Radio className="h-4 w-4" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {muted ? <MicOff className="h-2.5 w-2.5" /> : <Mic className="h-2.5 w-2.5" />}
          </span>
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate text-xs font-bold text-foreground">{name || 'Sesli oda'}</span>
          <span className="block truncate text-[10px] text-muted-foreground">Odaya dönmek için dokun</span>
        </span>
      </motion.button>
    </div>
  );
}