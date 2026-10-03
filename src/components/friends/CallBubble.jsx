import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function CallBubble({ avatar, name, onOpen }) {
  const bounds = useRef(null);
  const moved = useRef(false);
  return <div ref={bounds} className="pointer-events-none fixed inset-x-3 top-3 z-[230]" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
    <motion.button type="button" drag dragConstraints={bounds} dragMomentum={false} dragElastic={0}
      onDragStart={() => { moved.current = true; }}
      onPointerDown={() => { moved.current = false; }}
      onClick={() => { if (!moved.current) onOpen(); }}
      aria-label={`${name || 'Kullanıcı'} ile aramaya dön`}
      className="pointer-events-auto absolute bottom-0 right-0 h-16 w-16 touch-none rounded-full border-2 border-primary bg-card shadow-lg">
      {avatar ? <Image src={avatar} alt={name || 'Arama'} className="h-full w-full overflow-hidden rounded-full" draggable={false} />
        : <span className="flex h-full w-full items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">{(name || '?')[0]}</span>}
      <span className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground"><Phone className="h-3 w-3" /></span>
    </motion.button>
  </div>;
}