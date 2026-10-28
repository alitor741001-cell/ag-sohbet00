import useKeyedImage from '@/hooks/useKeyedImage';
import DesignArt from '@/components/layout/DesignArt';
import { ART } from '@/lib/designArt';
import { Gift, UserRound } from 'lucide-react';

// Profil şeridinin beyaz zemini ve içindeki beyaz yer tutucu daire temizlenir;
// görselin içine basılı örnek yazı alanları koyu zeminle örtülür (gerçek bilgiler üstüne yazılır).
const PROFILE_CROP = {
  top: 0.16,
  height: 0.69,
  clearWhiteIslands: true,
  erase: [[176, 646, 640, 130], [624, 366, 792, 230]],
};
const PROFILE_RATIO = 1663 / (0.69 * 946);

// Hediye toplamı puan cinsindendir: 1.000 puan = 1K.
const kText = (value) => {
  const k = Math.round((Number(value) || 0) / 1000);
  return k >= 1000 ? `${(k / 1000).toFixed(1)}M` : `${k}K`;
};

/** Sesli odanın üst şeridi: solda oda kartı (fotoğraf, isim, ID, hediyeler),
    sağda izleyici sayısı, yöneticide oda ayarları ve en sağda çıkış düğmesi. */
export default function RoomTopArt({
  room,
  giftTotal = 0,
  giftToday = 0,
  onOpenRoom,
  viewerCount = 0,
  onOpenViewers,
  onOpenMenu,
  onExit,
  showMenu = false,
}) {
  const profile = useKeyedImage(ART.roomProfileBar, PROFILE_CROP);
  const shown = viewerCount > 999 ? '999+' : String(viewerCount || 0);
  const roomId = room?.room_number || room?.personal_room_code || '';

  return (
    <div
      className="relative z-30 flex shrink-0 items-start gap-1 px-2"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4px)' }}
    >
      <div className="relative shrink-0" style={{ width: 'clamp(180px, 52vw, 232px)', aspectRatio: String(PROFILE_RATIO) }}>
        {profile && (
          <img
            src={profile}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
          />
        )}

        {/* Oda profil fotoğrafı: tasarımdaki daire boşluğun içine oturur. */}
        <button
          type="button"
          onClick={onOpenRoom}
          aria-label="Oda profili"
          className="absolute overflow-hidden rounded-full active:scale-95"
          style={{ left: '22.1%', top: '42.7%', width: '22.8%', aspectRatio: '1', transform: 'translate(-50%, -50%)' }}
        >
          {room?.cover_url ? (
            <img src={room.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-black/50">
              <UserRound className="h-1/2 w-1/2 text-[#ff6b6b]" />
            </span>
          )}
        </button>

        {/* Oda ismi ve ID numarası: tasarımdaki alt plaka. */}
        <button
          type="button"
          onClick={onOpenRoom}
          className="absolute flex flex-col justify-center px-1 text-left"
          style={{ left: '9.6%', top: '72%', width: '41%', height: '26%' }}
        >
          <span
            className="truncate text-[11px] font-black leading-tight text-[#ffeec2]"
            style={{ textShadow: '0 0 8px rgba(255,90,60,0.85)' }}
          >
            {room?.name || 'Sesli Oda'}
          </span>
          <span className="truncate text-[9px] font-bold leading-tight text-[#ff8f8f]">ID: {roomId || '-'}</span>
        </button>

        {/* Hediye miktarları: tasarımdaki sağ şerit. */}
        <button
          type="button"
          onClick={onOpenRoom}
          className="absolute flex flex-col items-center justify-center gap-0.5"
          style={{ left: '36.6%', top: '30.4%', width: '50%', height: '41.4%' }}
        >
          <span
            className="flex items-center gap-1 text-[13px] font-black leading-none text-[#ffd9a1]"
            style={{ textShadow: '0 0 10px rgba(255,140,40,0.9)' }}
          >
            <Gift className="h-3.5 w-3.5" />
            {kText(giftTotal)}
          </span>
          <span className="text-[9px] font-bold leading-none text-[#ffe1a8]/85">Bugün {kText(giftToday)}</span>
        </button>
      </div>

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