import { memo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Check, EyeOff, Film, Gamepad2, Lock, MessageSquare, Mic, Music, PartyPopper, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { youtubeIdFromMovieId } from '@/lib/youtubeTitle';
import { prefetchRoomCancel, prefetchRoomSoon } from '@/lib/roomPrefetch';
import { useCurrentUser } from '@/lib/useCurrentUser';

/** Oda kategorisi kartın sağ üstünde kendi ikonuyla gösterilir. */
const CATEGORY_ICONS = { Sohbet: MessageSquare, DJ: Music, 'Eğlence': Sparkles, 'Parti': PartyPopper, Oyun: Gamepad2 };

/** Ana sayfa keşfet ızgarasındaki kare oda kartı: altın çerçeveli premium kart. */
function RoomDiscoveryCard({ room, owner, kind, filmTitle, friendInside }) {
  const { user } = useCurrentUser();
  const viewers = room.participants?.length || 0;
  // İçeride kimse yoksa oda kilitlidir: sahibi odaya girene kadar kimse içeri alınmaz.
  const locked = viewers === 0 && user?.id !== room.owner_id;
  const isVoice = kind === 'voice';
  // Gizli oda yalnızca yönetici listesine düşer: kartın sağ altında işaretlenir.
  const isHidden = room.hidden === true;
  const videoId = isVoice ? '' : youtubeIdFromMovieId(room.movie_id);
  const cover = isVoice ? owner?.avatar : videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
  // Gizli etiketi sığsın diye o kartta iki kişi gösterilir.
  const people = (room.participants || []).slice(0, isHidden ? 2 : 3);
  const ownerName = owner?.username || owner?.full_name || room.owner_name || 'Kullanıcı';
  // Oda panelinden seçilen kategori (Sohbet, DJ, Oyun…) kartın sağ üstünde görünür.
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
      onClick={(event) => { if (locked) event.preventDefault(); }}
      aria-disabled={locked || undefined}
      className="relative flex aspect-square flex-col overflow-hidden rounded-2xl border border-premium-gold/30 bg-anthracite-raised shadow-[0_0_24px_-12px_rgba(198,40,40,0.95)] transition-transform active:scale-[0.98]"
    >
      {/* Kapak kartı tamamen kaplar: kart kare kalır, bilgiler kapak üstünde durur. */}
      {cover ? (
        <Image src={cover} className="absolute inset-0 h-full w-full" fittingType="fill" alt="" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-premium-red-deep to-anthracite">
          {isVoice ? <Mic className="h-8 w-8 text-premium-gold/50" /> : <Film className="h-8 w-8 text-premium-gold/50" />}
        </span>
      )}
      <span
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(11,9,7,0.96), rgba(11,9,7,0.5) 55%, rgba(11,9,7,0.08))' }}
      />

      {/* CANLI: kırmızı gradient etiket, beyaz nokta ve hafif glow. */}
      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-white/25 bg-gradient-to-r from-premium-red-deep to-premium-red px-2 py-0.5 text-[9.5px] font-black tracking-wide text-white shadow-[0_0_14px_-3px_rgba(198,40,40,0.95)]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> CANLI
      </span>

      {/* Sağ üst: oda kategorisi ve arkadaş işareti alt alta durur. */}
      {(category || friendInside) && (
        <span className="absolute right-2 top-2 flex max-w-[72%] flex-col items-end gap-1">
          {category && (
            <span
              title={`Kategori: ${category}`}
              className="flex items-center gap-1 rounded-full border border-premium-gold/60 bg-gradient-to-r from-premium-red-deep to-premium-red px-2 py-0.5 text-[9.5px] font-black text-white shadow-[0_0_12px_-3px_rgba(198,40,40,0.95)]"
            >
              {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
              {category}
            </span>
          )}
          {friendInside && (
            <span
              title="Arkadaşın"
              className="flex items-center gap-1 rounded-full border border-premium-gold/60 bg-anthracite/90 px-2 py-0.5 text-[9.5px] font-black text-premium-gold shadow-[0_0_12px_-3px_rgba(212,175,55,0.9)]"
            >
              <Check className="h-3 w-3" strokeWidth={3} /> Ekli
            </span>
          )}
        </span>
      )}

      {/* Kilit ekranı: oda boşken kartın üzerinde kilit görünür, tıklama odaya sokmaz. */}
      {locked && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70">
          <Lock className="h-6 w-6 text-premium-gold" />
          <span className="text-[9.5px] font-black tracking-wide text-premium-gold">ODA KİLİTLİ</span>
          <span className="text-[9px] font-semibold text-white/60">Sahibi odada değil</span>
        </span>
      )}

      <div className="relative mt-auto flex min-w-0 flex-col gap-1 p-2.5">
        {!isVoice && filmTitle && (
          <span className="line-clamp-2 text-[10.5px] font-bold leading-tight text-premium-gold/85">{filmTitle}</span>
        )}
        <p className="truncate text-[12.5px] font-extrabold text-white">{room.name}</p>

        <span className="flex items-center gap-1.5">
          {owner?.avatar ? (
            <Image src={owner.avatar} className="h-4 w-4 shrink-0 overflow-hidden rounded-full border border-premium-gold/50" fittingType="fill" alt="" />
          ) : (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-premium-gold to-premium-gold-deep text-[8px] font-black text-black">
              {(ownerName || '?')[0]}
            </span>
          )}
          <span className="truncate text-[11px] font-semibold text-premium-gold/90">{ownerName}</span>
          {room.password && <Lock className="h-3 w-3 shrink-0 text-premium-gold" />}
          <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-premium-gold/25 bg-black/70 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            <BarChart3 className="h-3 w-3 text-premium-gold" /> {viewers}
          </span>
        </span>

        <span className="flex items-center gap-1">
          <span className="rounded-full border border-premium-gold/55 bg-gradient-to-r from-premium-red-deep to-premium-red px-2 py-0.5 text-[9.5px] font-black text-white shadow-[0_0_10px_-3px_rgba(198,40,40,0.9)]">
            {isVoice ? 'Sesli' : 'Film'}
          </span>
          <span className="ml-auto flex items-center gap-1">
            {people.map((person) => (
              <span key={person.user_id} className="h-5 w-5 overflow-hidden rounded-full border border-premium-gold/30 bg-black/60">
                {person.avatar ? (
                  <Image src={person.avatar} className="h-full w-full" fittingType="fill" alt="" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[8px] font-bold text-white">
                    {(person.name || '?')[0]}
                  </span>
                )}
              </span>
            ))}
            {viewers > people.length && (
              <span className="text-[10px] font-bold text-white/60">+{viewers - people.length}</span>
            )}
          </span>
          {isHidden && (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-premium-gold/60 bg-anthracite/95 px-2 py-0.5 text-[9.5px] font-black text-premium-gold shadow-[0_0_12px_-3px_rgba(212,175,55,0.9)]">
              <EyeOff className="h-3 w-3" /> Gizli oda
            </span>
          )}
        </span>
      </div>
    </Link>
  );
}

// Kart yalnızca kendi verisi değiştiğinde yeniden çizilir: liste tazelenirken ızgara akıcı kalır.
export default memo(RoomDiscoveryCard);