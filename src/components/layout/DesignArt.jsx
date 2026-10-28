import useKeyedImage from '@/hooks/useKeyedImage';

const FULL = { top: 0, height: 1 };

/** Beyaz zeminli tasarım görselini şeffaf PNG gibi gösterir. */
export default function DesignArt({ src, alt = '', className = '', style }) {
  const keyed = useKeyedImage(src, FULL);
  if (!keyed) return null;
  return (
    <img
      src={keyed}
      alt={alt}
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
      style={style}
    />
  );
}