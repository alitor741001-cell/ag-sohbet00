import { Image } from '@/components/ui/image';

const ZEUS_ART = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/d530a6cd9_generated_image.png';

/** Zeus kahraman bölümü: tanrı figürü, NO.1 rozeti ve ücretsiz dönüş göstergesi. */
export default function ZeusHero({ avatar, scatterCount = 0 }) {
  return (
    <div className="zeus-surface relative h-[170px] shrink-0 overflow-hidden rounded-2xl border border-game-gold/40">
      <Image src={ZEUS_ART} alt="" className="absolute inset-0 h-full w-full" fittingType="fill" focalPointY={0.42} />
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-2.5 pb-2 pt-10">
        <div className="gold-plate relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-game-gold/70 shadow-[0_0_16px_-4px_hsl(var(--game-gold))]">
          <span className="absolute -top-2 rounded-full bg-game-red px-1.5 text-[8px] font-black text-white">NO.1</span>
          {avatar
            ? <Image src={avatar} alt="" className="h-8 w-8 rounded-full" />
            : <span className="text-lg">🌿</span>}
        </div>
        <p className="min-w-0 flex-1 text-[12px] font-black leading-tight text-game-gold [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
          <span className="mr-1 text-base tabular-nums text-white">{scatterCount}</span>
          <span className="mr-1">⚡</span>
          Ücretsiz Dönüş modunu açar
        </p>
      </div>
    </div>
  );
}