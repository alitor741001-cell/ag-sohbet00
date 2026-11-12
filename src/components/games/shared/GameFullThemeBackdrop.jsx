import { Image } from '@/components/ui/image';
import gameThemeArtwork from '@/components/games/shared/gameThemeArtwork';
import '@/components/games/shared/gameFullTheme.css';

/** Başlıktaki görsel tema, alt kontrol paneline kadar tek kesintisiz zemin. */
export default function GameFullThemeBackdrop({ game }) {
  return (
    <div aria-hidden="true" className="game-full-theme-art pointer-events-none overflow-hidden">
      <Image src={gameThemeArtwork[game]} alt="" fittingType="fill"
        className="block h-full w-full" quality={85} loading="eager" blurPlaceholder={false} />
    </div>
  );
}