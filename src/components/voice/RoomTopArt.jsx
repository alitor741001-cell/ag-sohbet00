import useKeyedImage from '@/hooks/useKeyedImage';
import DesignArt from '@/components/layout/DesignArt';
import { ART } from '@/lib/designArt';
import { UserRound } from 'lucide-react';

// Oda şeridi: beyaz fotoğraf penceresi şeffaf yapılır, oda fotoğrafı pencerenin arkasından görünür.
const BAR_CROP = { top: 0.24, height: 0.54, windows: [[111, 195, 305, 337]] };
const BAR_RATIO = 2172 / (0.54 * 724);
// Hediye kartı: içindeki örnek sayı koyu zeminle örtülür, yerine odanın gerçek toplamı yazılır.
const PILL_CROP = { top: 0.3, height: 0.42, erase: [[459, 448, 739, 316]] };
const PILL_RATIO = 1369 / (0.42 * 1149);

// Hediye toplamı puan cinsindendir: 1.000 puan = 1K.
const kText = (value) => {
  const k = Math.round((Number(value) || 0) / 1000);
  return k >= 1000 ? `${(k / 1000).toFixed(1)}M` : `${k}K`;
};

/** Sesli odanın üst şeridi: solda oda şeridi (fotoğraf, isim, ID) ve altında hediye kartı,
    sağda izleyici sayısı, yöneticide oda ayarları ve en sağda çıkış düğmesi. */
export default function RoomTopArt({
  room,
  giftTotal = 0,
  onOpenRoom,
  viewerCount = 0,
  onOpenViewers,
  onOpenMenu,
  onExit,
  showMenu = false,
}) {
  const barArt = useKeyedImage(ART.roomBar, BAR_CROP);
  const pillArt = useKeyedImage(ART.roomGiftPill, PILL_CROP);
  const shown = viewerCount > 999 ? '999+' : String(viewerCount || 0);
  const roomId = room?.room_number || room?.personal_room_code || '';

  return (
    <div
      className="relative z-30 flex shrink-0 items-start gap-1 px-2"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4px)' }}
    >
      <div className="min-w-0 shrink-0" style={{ width: 'clamp(178px, 58vw, 250px)' }}>
        <div className="relative" style={{ aspectRatio: String(BAR_RATIO) }}>
          {/* Oda fotoğrafı: şeridin penceresinin arkasında durur. */}
          <div className="absolute overflow-hidden" style={{ left: '5.1%', top: '5.5%', width: '14%', height: '86.1%' }}>
            {room?.cover_url ? (
              <img src={room.cover_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-black/45">
                <UserRound className="h-1/2 w-1/2 text-[#ff6b6b]" />
              </span>
            )}
          </div>

          {barArt && (
            <img
              src={barArt}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            />
          )}

          {/* Oda ismi ve ID numarası: şeridin koyu plakası. */}
          <button
            type="button"
            onClick={onOpenRoom}
            className="absolute flex flex-col justify-center text-left"
            style={{ left: '22%', top: '16.5%', width: '57%', height: '68%' }}
          >
            <span
              className="truncate text-[10px] font-black leading-tight text-white"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}
            >
              {room?.name || 'Sesli Oda'}
            </span>
            <span className="truncate text-[8px] font-bold leading-tight text-white/70">ID: {roomId || '-'}</span>
          </button>

          {/* Şeridin sağ ucundaki yuvarlak düğme: oda profilini açar. */}
          <button
            type="button"
            onClick={onOpenRoom}
            aria-label="Oda profili"
            className="absolute rounded-full active:scale-95"
            style={{ left: '89%', top: '49%', width: '14.5%', aspectRatio: '1', transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* Hediye kartı: şeridin hemen altında, beyaz zemin şeffaf. */}
        <div className="relative" style={{ marginLeft: '6%', marginTop: '-1.5%', width: '56%', aspectRatio: String(PILL_RATIO) }}>
          {pillArt && (
            <img
              src={pillArt}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            />
          )}
          <span className="absolute flex items-center justify-center" style={{ left: '34%', right: '13.5%', top: '22%', bottom: '15%' }}>
            <span
              className="truncate text-[11px] font-black leading-none text-white"
              style={{ textShadow: '0 0 8px rgba(255,60,40,0.85)' }}
            >
              {kText(giftTotal)}
            </span>
          </span>
        </div>
      </div>

      <div className="ml-auto mt-1 flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onOpenViewers}
          aria-label={`İzleyiciler: ${viewerCount}`}
          className="relative h-10 w-10 active:scale-95"
        >
          <DesignArt src={ART.roomViewers} className="absolute inset-0 h-full w-full object-contain" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className="rounded-full bg-black/70 px-1 font-black leading-none tabular-nums text-[#ff2b2b]"
              style={{ fontSize: shown.length > 2 ? 11 : 15, textShadow: '0 0 8px rgba(255,40,40,0.95)' }}
            >
              {shown}
            </span>
          </span>
        </button>
        {showMenu && (
          <button type="button" onClick={onOpenMenu} aria-label="Oda ayarları" className="h-10 w-10 active:scale-95">
            <DesignArt src={ART.roomSettings} className="h-full w-full object-contain" />
          </button>
        )}
        <button type="button" onClick={onExit} aria-label="Odadan çık" className="h-10 w-10 active:scale-95">
          <DesignArt src={ART.roomClose} className="h-full w-full object-contain" />
        </button>
      </div>
    </div>
  );
}