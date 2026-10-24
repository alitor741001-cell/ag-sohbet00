import { Image } from '@/components/ui/image';
import { useMaleRoomTheme } from '@/components/voice/MaleRoomTheme';
export default function MaleRoomSprite({ x, y, w, h, children, className = '', style }) {
  const { art } = useMaleRoomTheme();
  return (
    <span className={`relative block overflow-hidden ${className}`} style={{ aspectRatio: `${w}/${h}`, ...style }}>
      <Image src={art} alt="" draggable={false} className="pointer-events-none absolute select-none max-w-none" style={{ width: `${497 / w * 100}%`, height: `${1024 / h * 100}%`, left: `${-x / w * 100}%`, top: `${-y / h * 100}%` }} />
      {children}
    </span>
  );
}