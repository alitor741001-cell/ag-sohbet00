import useKeyedImage from '@/hooks/useKeyedImage';
import DesignArt from '@/components/layout/DesignArt';
import { ART } from '@/lib/designArt';
import { UserRound } from 'lucide-react';
import formatCoinAmount from '@/components/voice/formatCoinAmount';

// Oda şeridi: beyaz fotoğraf penceresi şeffaf yapılır, oda fotoğrafı pencerenin arkasından görünür.
const BAR_CROP = { top: 0.24, height: 0.54, windows: [[104, 216, 312, 312]] };
const BAR_RATIO = 2172 / (0.54 * 724);
// Hediye kartı: dama zemin şeffaf yapılır, elmas miktarı sağdaki alana yazılır.
const PILL_CROP = { top: 0, height: 1 };
const PILL_RATIO = 1935 / 812;
// İzleyici çemberi: beyaz zemin şeffaf yapılır.
const FULL_CROP = { top: 0, height: 1 };

// Elmas miktarı: odanın her yerinde kullanılan K/M kısaltmasıyla aynı biçim.
const amountText = (value) => formatCoinAmount(value);

/** Sesli odanın üst şeridi: solda oda şeridi (fotoğraf, isim, ID) ve altında hediye kartı,
    sağda izleyici sayısı, yöneticide oda ayarları ve en sağda çıkış düğmesi. */
export default function RoomTopArt({
  room,
  giftTotal = 0,
  onOpenGiftBoard,
  onOpenRoom,
  onFollow,
  viewerCount = 0,
  onOpenViewers,
  onOpenMenu,
  onExit,
  showMenu = false,
}) {
  const barArt = useKeyedImage(ART.roomBar, BAR_CROP);
  const pillArt = useKeyedImage(ART.roomGiftPill, PILL_CROP);
  const ringArt = useKeyedImage(ART.roomViewerBadge, FULL_CROP);
  const countArt = useKeyedImage(ART.roomViewerCount, { ...FULL_CROP, fillWhiteBlack: true });
  const shown = viewerCount > 999 ? '999+' : String(viewerCount || 0);
  const roomId = room?.room_number || room?.personal_room_code || '';

  return (
    <div
      className="relative z-30 flex shrink-0 items-start gap-1 px-2"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4px)' }}
    >
      <div className="min-w-0 shrink-0" style={{ width: 'clamp(178px, 58vw, 250px)' }}>
        <div className="relative" style={{ aspectRatio: String(BAR_RATIO) }}>
          {/* Oda fotoğrafı: basılınca odanın profil sayfası açılır. */}
          <button
            type="button"
            onClick={onOpenRoom}
            aria-label="Oda profilini aç"
            className="absolute overflow-hidden active:scale-95"
            style={{ left: '4.8%', top: '10.7%', width: '14.4%', height: '79.8%' }}
          >
            {room?.cover_url ? (
              <img src={room.cover_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-black/45">
                <UserRound className="h-1/2 w-1/2 text-[#ff6b6b]" />
              </span>
            )}
          </button>

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

          {/* Şeridin sağ ucundaki yeşil düğme: odanın sahibini takibe alır. */}
          <button
            type="button"
            onClick={onFollow}
            aria-label="Yayıncıyı takip et"
            className="absolute rounded-full active:scale-95"
            style={{ left: '89%', top: '49%', width: '14.5%', aspectRatio: '1', transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* Hediye kartı: küçültülüp sola ve biraz aşağı alındı; basılınca hediye sıralaması açılır. */}
        <button
          type="button"
          onClick={onOpenGiftBoard}
          aria-label="Hediye sıralamasını aç"
          className="relative block active:scale-[0.97]"
          style={{ marginLeft: '-2%', marginTop: '6px', width: '34%', aspectRatio: String(PILL_RATIO) }}
        >
          {pillArt && (
            <img
              src={pillArt}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            />
          )}
          {/* Toplam hediye alanı sağa ve sola doğru genişletildi. */}
          <span className="absolute flex items-center justify-center" style={{ left: '26%', right: '2%', top: '24%', bottom: '19%' }}>
            <span
              className="truncate font-black leading-none text-white"
              style={{ fontSize: 'clamp(6px, 1.6vw, 9px)', textShadow: '0 0 8px rgba(255,60,40,0.85)' }}
            >
              {amountText(giftTotal)}
            </span>
          </span>
        </button>
      </div>

      <div className="ml-auto mt-1 flex shrink-0 items-center gap-1">
        {/* İzleyici sayısı: izleyici çemberinin soluna birleşik, küçük kırmızı çember. */}
        <button
          type="button"
          onClick={onOpenViewers}
          aria-label={`İzleyiciler: ${viewerCount}`}
          className="relative -mr-2.5 h-6 w-6 shrink-0 active:scale-95"
        >
          {countArt && (
            <img
              src={countArt}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            />
          )}
          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-black leading-none tabular-nums text-red-500"
              style={{
                fontSize: shown.length > 2 ? 6 : shown.length > 1 ? 8 : 10,
                textShadow: '0 1px 2px rgba(0,0,0,0.9)',
              }}
            >
              {shown}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenViewers}
          aria-label={`İzleyiciler: ${viewerCount}`}
          className="relative h-11 w-11 shrink-0 active:scale-95"
        >
          {ringArt && (
            <img
              src={ringArt}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            />
          )}
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