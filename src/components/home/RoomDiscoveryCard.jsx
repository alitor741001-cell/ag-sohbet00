import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Cake, Check, Eye, EyeOff, Film, Gamepad2, Lock, MessageSquare, Mic, Music, PartyPopper, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { youtubeIdFromMovieId } from '@/lib/youtubeTitle';
import { prefetchRoomCancel, prefetchRoomSoon } from '@/lib/roomPrefetch';
import { rememberRoom } from '@/lib/visitedRooms';
import { useCurrentUser } from '@/lib/useCurrentUser';

/** Oda kategorisi kartın üstünde kendi ikonuyla gösterilir. */
const CATEGORY_ICONS = { Sohbet: MessageSquare, DJ: Music, 'Eğlence': Sparkles, 'Parti': PartyPopper, Oyun: Gamepad2, 'Doğum Günü': Cake };

// Oda ismi neon geçişli yazılır.
const NAME_GRADIENT = {
  backgroundImage: 'linear-gradient(90deg,#22f9ff 0%,#b900ff 38%,#ff7a00 68%,#fff83d 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
};

/** Ana sayfa ızgarasındaki oda kartı: kapak görseli, neon çerçeve, oda ismi ve sahibi.
    Görsel kesme işlemi yapılmaz — kartlar anında çizilir, liste akıcı kayar. */
function RoomDiscoveryCard({ room, owner, kind, filmTitle, friendInside }) {
  const { user } = useCurrentUser();
  const viewers = room.participants?.length || 0;
  // İçeride kimse yoksa oda kilitlidir: sahibi odaya girene kadar kimse içeri alınmaz.
  const locked = viewers === 0 && user?.id !== room.owner_id;
  const isVoice = kind === 'voice';
  const isHidden = room.hidden === true;
  const videoId = isVoice ? '' : youtubeIdFromMovieId(room.movie_id);
  // Film kapağı: kenarında siyah bant olmayan (16:9) küçük görsel kullanılır.
  const cover = isVoice ? owner?.avatar : videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
  const ownerName = owner?.username || owner?.full_name || room.owner_name || 'Kullanıcı';
  const category = room.category || '';
  const CategoryIcon = CATEGORY_ICONS[category] || null;
  const to = isVoice ? `/sesli-oda/${room.id}` : `/oda/${room.id}`;

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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b13]/85 shadow-[0_16px_32px_-26px_rgba(0,0,0,1)] transition-transform active:scale-[0.98]"
    >
      {/* Kapak: sıcak kırmızı-pembe ışık kartın üstünde durur. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.35),transparent_70%)]" />

      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
        {cover ? (
          <Image src={cover} className="absolute inset-0 h-full w-full" fittingType="fill" alt="" />
        ) : (
          <span className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${isVoice ? 'from-[#1b2a4d] to-[#0a0f1c]' : 'from-[#3a1b1b] to-[#120a0a]'}`}>
            {isVoice ? <Mic className="h-7 w-7 text-[#7ff0e6]/70" /> : <Film className="h-7 w-7 text-[#ffa63d]/70" />}
          </span>
        )}

        {/* Üst sağ: kategori ve arkadaş işareti. */}
        {(category || friendInside) && (
          <span className="absolute right-1 top-1 flex max-w-[85%] flex-col items-end gap-1">
            {category && (
              <span
                title={`Kategori: ${category}`}
                className="flex items-center gap-1 rounded-full border border-white/25 bg-black/70 px-1.5 py-0.5 text-[8px] font-black text-white"
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

      {/* Alt bilgi: oda ismi ve sahibi. */}
      <div className="relative flex flex-col gap-0.5 px-2 py-1.5">
        <span className="block truncate text-[11px] font-black leading-tight" style={NAME_GRADIENT}>
          {room.name}
        </span>
        <span className="flex items-center justify-between gap-1">
          <span className="truncate text-[9px] font-semibold text-white/60">{ownerName}</span>
          <span className="flex shrink-0 items-center gap-0.5 text-[9px] font-black uppercase tracking-wide text-primary/90">
            {isVoice ? <Mic className="h-2.5 w-2.5" /> : <Film className="h-2.5 w-2.5" />}
            {isVoice ? 'Sesli' : 'Film'}
          </span>
        </span>
      </div>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
    </Link>
  );
}

// Kart yalnızca kendi verisi değiştiğinde yeniden çizilir: liste tazelenirken ızgara akıcı kalır.
export default memo(RoomDiscoveryCard);