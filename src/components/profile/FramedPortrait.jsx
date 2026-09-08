import PreparedFrameImage from '@/components/xp/PreparedFrameImage';

const SIZES = {
  xs: 'h-14 w-14 text-[10px]',
  sm: 'h-20 w-20 text-xs',
  md: 'h-28 w-28 text-sm',
  lg: 'h-64 w-64 text-3xl',
};

// Çerçeve sabit kalır; `scale` profil fotoğrafını yakınlaştırır, `panX`/`panY` kaydırır.
// Avatar plain <img> + object-cover ile anında yüklenir — siyahlık kalmasın diye
// açıklıktan biraz daha büyük kesilir.
export default function FramedPortrait({ info, avatar, name, size = 'md', className = '', scale = 100, panX = 0, panY = 0 }) {
  const [x, y, width, height] = info.opening;
  // Avatarı çerçeve açıklığından %4 daha büyük yap — ortada siyahlık kalmasın
  const expand = 0.04;
  const diameter = Math.min(width, height) * (1 + expand);
  const left = x + (width - diameter) / 2;
  const top = y + (height - diameter) / 2;
  const zoom = Math.min(180, Math.max(80, Number(scale) || 100));
  const px = Math.max(-100, Math.min(100, Number(panX) || 0));
  const py = Math.max(-100, Math.min(100, Number(panY) || 0));
  return (
    <div className={`relative isolate shrink-0 ${SIZES[size] || SIZES.md} ${className}`}>
      <div className="absolute z-0 overflow-hidden rounded-full" style={{ left: `${left * 100}%`, top: `${top * 100}%`, width: `${diameter * 100}%`, height: `${diameter * 100}%` }}>
        <div className="h-full w-full" style={{ transform: `scale(${zoom / 100}) translate(${px}%, ${py}%)` }}>
          {avatar
            ? <img src={avatar} alt={name || 'Profil fotoğrafı'} className="h-full w-full object-cover object-center" referrerPolicy="no-referrer" draggable={false} />
            : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent font-bold text-primary-foreground">{(name || '?')[0]}</span>}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] h-full w-full"><PreparedFrameImage src={info.image_url} opening={info.opening} /></div>
    </div>
  );
}