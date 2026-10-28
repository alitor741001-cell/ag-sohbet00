import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Cake, Check, Eye, EyeOff, Film, Gamepad2, Lock, MessageSquare, Mic, Music, PartyPopper, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { youtubeIdFromMovieId } from '@/lib/youtubeTitle';
import { prefetchRoomCancel, prefetchRoomSoon } from '@/lib/roomPrefetch';
import { rememberRoom } from '@/lib/visitedRooms';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useKeyedImage from '@/hooks/useKeyedImage';
import { ART } from '@/lib/designArt';

/** Oda kategorisi kartın sağ üstünde kendi ikonuyla gösterilir. */
const CATEGORY_ICONS = { Sohbet: MessageSquare, DJ: Music, 'Eğlence': Sparkles, 'Parti': PartyPopper, Oyun: Gamepad2, 'Doğum Günü': Cake };

// Kart çerçevesi: beyaz fotoğraf alanı ve isim şeritleri şeffaf yapılır,
// veriler arkadan görünür ve çerçevenin üzerine yazılır.
const CARD_CROP = { top: 0, height: 1, clearWhiteIslands: 'all', islandMin: 0.004 };
const CARD_RATIO = 1078 / 1459;
// Oda isminin plakası: her iki çerçevede de metin siyah zemin üstünde durur.
const NAME_PLATE = { left: '21%', right: '9%', top: '67.2%', height: '7.6%', background: '#000', borderRadius: 4 };
// Oda ismi görseldeki gibi soldan sağa camgöbeği → mor → turuncu geçişli yazılır.
const NAME_GRADIENT = {
  backgroundImage: 'linear-gradient(90deg,#22f9ff 0%,#b900ff 38%,#ff7a00 68%,#fff83d 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  filter: 'drop-shadow(0 1px 1px #000) drop-shadow(0 0 6px rgba(0,0,0,0.95))',
};

/** Ana sayfa keşfet ızgarasındaki oda kartı: moda göre sesli/film çerçevesi,
    büyük fotoğraf, şeritte oda ismi ve altta oda sahibinin adı. */
function RoomDiscoveryCard({ room, owner, kind, filmTitle, friendInside }) {
  const { user } = useCurrentUser();
  const viewers = room.participants?.length || 0;
  // İçeride kimse yoksa oda kilitlidir: sahibi odaya girene kadar kimse içeri alınmaz.
  const locked = viewers === 0 && user?.id !== room.owner_id;
  const isVoice = kind === 'voice';
  const isHidden = room.hidden === true;
  const videoId = isVoice ? '' : youtubeIdFromMovieId(room.movie_id);
  // Film kapağı: kenarında siyah bant olmayan (16:9) küçük görsel kullanılır, çerçeve tamamen dolar.
  const cover = isVoice ? owner?.avatar : videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
  const ownerName = owner?.username || owner?.full_name || room.owner_name || 'Kullanıcı';
  const category = room.category || '';
  const CategoryIcon = CATEGORY_ICONS[category] || null;
  const to = isVoice ? `/sesli-oda/${room.id}` : `/oda/${room.id}`;
  const art = useKeyedImage(isVoice ? ART.cardVoice : ART.cardFilm, CARD_CROP);

  return (
    <Link
      to={to}
      onPointerDown={locked ? undefined : () => prefetchRoomSoon(room.id)}
      onPointerMove={locked ? undefined : () => prefetchRoomCancel(room.id)}
      onPointerUp={locked ? undefined : () => prefetchRoomCancel(room.id)}
      onPointerLeave={locked ? undefined : () => prefetchRoomCancel(room.id)}
      onClick={(event) => {
        if (locked) { event.preventDefault(); return; }
        rememberRoom(room);
      }}
      aria-disabled={locked || undefined}
      className="relative block transition-transform active:scale-[0.98]"
      style={{ aspectRatio: String(CARD_RATIO) }}
    >
      {/* Fotoğraf penceresi: çerçevenin arkasında durur, pencereden görünür. */}
      <div className="absolute overflow-hidden" style={{ left: '7.2%', top: '17.4%', width: '85.6%', height: '47.6%' }}>
        {cover ? (
          <Image src={cover} className="absolute inset-0 h-full w-full" fittingType="fill" alt="" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#173a5e] to-[#0a1220]">
            {isVoice ? <Mic className="h-7 w-7 text-[#7ff0e6]/70" /> : <Film className="h-7 w-7 text-[#ffa63d]/70" />}
          </span>
        )}

        {/* Sağ üst: kategori ve arkadaş işareti. */}
        {(category || friendInside) && (
          <span className="absolute right-1 top-1 flex max-w-[85%] flex-col items-end gap-1">
            {category && (
              <span
                title={`Kategori: ${category}`}
                className="flex items-center gap-1 rounded-full border border-white/30 bg-black/70 px-1.5 py-0.5 text-[8px] font-black text-white"
              >
                {CategoryIcon && <CategoryIcon className="h-2.5 w-2.5" />}
                {category}
              </span>
            )}
            {friendInside && (
              <span
                title="Arkadaşın"
                className="flex items-center gap-1 rounded-full border border-[#7ff0e6]/60 bg-black/75 px-1.5 py-0.5 text-[8px] font-black text-[#7ff0e6]"
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} /> Ekli
              </span>
            )}
          </span>
        )}

        {isHidden && (
          <span className="absolute right-1 bottom-1 flex items-center gap-1 rounded-full bg-black/80 px-1.5 py-0.5 text-[8px] font-black text-white">
            <EyeOff className="h-2.5 w-2.5" /> Gizli
          </span>
        )}

        {/* Alt şerit: izleyici sayısı. */}
        {!isHidden && (
          <span className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[8.5px] font-extrabold tabular-nums text-white">
            {viewers}
            <Eye className="h-2.5 w-2.5 text-[#7ff0e6]" />
          </span>
        )}

        {locked && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/72">
            <Lock className="h-5 w-5 text-[#7ff0e6]" />
            <span className="text-[9px] font-black tracking-wide text-[#7ff0e6]">ODA KİLİTLİ</span>
            <span className="text-[8px] font-semibold text-white/60">Sahibi odada değil</span>
          </span>
        )}
      </div>

      {art && (
        <img
          src={art}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        />
      )}

      {/* Oda ismi: çerçevenin üstündeki siyah plaka — iki kart türünde de aynı görünür. */}
      <span className="absolute flex items-center justify-center overflow-hidden px-1" style={{ ...NAME_PLATE }}>
        <span className="block w-full truncate text-center text-[10px] font-black leading-none tracking-tight" style={NAME_GRADIENT}>
          {room.name}
        </span>
      </span>

      {/* Oda sahibi: “Sesli / Film” yazısının solunda. */}
      <span className="absolute flex items-center justify-end overflow-hidden" style={{ left: '9%', right: '47%', top: '78%', height: '6%' }}>
        <span className="truncate text-[8.5px] font-black leading-none text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>
          {ownerName}
        </span>
      </span>
    </Link>
  );
}

// Kart yalnızca kendi verisi değiştiğinde yeniden çizilir: liste tazelenirken ızgara akıcı kalır.
export default memo(RoomDiscoveryCard);