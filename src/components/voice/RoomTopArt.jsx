import useKeyedImage from '@/hooks/useKeyedImage';
import DesignArt from '@/components/layout/DesignArt';
import { ART } from '@/lib/designArt';

// Profil şeridinin beyaz zemini ve içindeki beyaz yer tutucu daire temizlenir.
const PROFILE_CROP = { top: 0, height: 1, clearWhiteIslands: true };

/** Sesli odanın üst şeridi: solda profil şeridi, sağda izleyici sayısı,
    yöneticide oda ayarları ve en sağda çıkış düğmesi. */
export default function RoomTopArt({ onOpenRoom, viewerCount = 0, onOpenViewers, onOpenMenu, onExit, showMenu = false }) {
  const profile = useKeyedImage(ART.roomProfileBar, PROFILE_CROP);
  const shown = viewerCount > 999 ? '999+' : String(viewerCount || 0);

  return (
    <div
      className="relative z-30 flex shrink-0 items-start gap-1 px-2"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4px)' }}
    >
      <button
        type="button"
        onClick={onOpenRoom}
        aria-label="Oda profili"
        className="shrink-0 active:scale-[0.98]"
      >
        {profile && (
          <img
            src={profile}
            alt=""
            draggable={false}
            className="pointer-events-none h-[clamp(62px,21vw,94px)] w-auto select-none"
          />
        )}
      </button>

      <div className="ml-auto mt-1 flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenViewers}
          aria-label={`İzleyiciler: ${viewerCount}`}
          className="relative h-11 w-11 active:scale-95"
        >
          <DesignArt src={ART.roomViewers} className="absolute inset-0 h-full w-full object-contain" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className="rounded-full bg-black/70 px-1 font-black leading-none tabular-nums text-[#ff2b2b]"
              style={{ fontSize: shown.length > 2 ? 12 : 16, textShadow: '0 0 8px rgba(255,40,40,0.95)' }}
            >
              {shown}
            </span>
          </span>
        </button>
        {showMenu && (
          <button type="button" onClick={onOpenMenu} aria-label="Oda ayarları" className="h-11 w-11 active:scale-95">
            <DesignArt src={ART.roomSettings} className="h-full w-full object-contain" />
          </button>
        )}
        <button type="button" onClick={onExit} aria-label="Odadan çık" className="h-11 w-11 active:scale-95">
          <DesignArt src={ART.roomClose} className="h-full w-full object-contain" />
        </button>
      </div>
    </div>
  );
}