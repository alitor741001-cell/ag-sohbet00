import { Image } from '@/components/ui/image';

export default function PortraitPhoto({ portrait, avatar, name, scale = 100, panX = 0, panY = 0 }) {
  if (!portrait) return null;
  const [x, y, width, height] = portrait.bounds;
  const zoom = Math.max(100, Math.min(180, Number(scale) || 100)) / 100;
  const limit = (1 - 1 / zoom) * 50;
  const px = Math.max(-limit, Math.min(limit, Number(panX) || 0));
  const py = Math.max(-limit, Math.min(limit, Number(panY) || 0));
  return <div className="pointer-events-none absolute inset-0" style={{ maskImage: `url("${portrait.mask}")`, WebkitMaskImage: `url("${portrait.mask}")`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat' }}>
    <div className="absolute" style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${width * 100}%`, height: `${height * 100}%` }}>
      <div className="h-full w-full" style={{ transform: `scale(${zoom}) translate(${px}%, ${py}%)` }}>
        {avatar ? <Image src={avatar} alt={name || 'Profil fotoğrafı'} fittingType="fill" loading="eager" className="h-full w-full" draggable={false} /> : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent font-bold text-primary-foreground">{(name || '?')[0]}</span>}
      </div>
    </div>
  </div>;
}