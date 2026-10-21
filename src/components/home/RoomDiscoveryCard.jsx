import { memo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Cake, Check, EyeOff, Film, Gamepad2, Lock, MessageSquare, Mic, Music, PartyPopper, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { youtubeIdFromMovieId } from '@/lib/youtubeTitle';
import { prefetchRoomCancel, prefetchRoomSoon } from '@/lib/roomPrefetch';
import { rememberRoom } from '@/lib/visitedRooms';
import { useCurrentUser } from '@/lib/useCurrentUser';

/** Oda kategorisi kartın sağ üstünde kendi ikonuyla gösterilir. */
const CATEGORY_ICONS = { Sohbet: MessageSquare, DJ: Music, 'Eğlence': Sparkles, 'Parti': PartyPopper, Oyun: Gamepad2, 'Doğum Günü': Cake };

/** İlk üç oda için madalya tonu: kırmızı, gümüş, bronz. */
const RANK_STYLE = {
  1: 'linear-gradient(160deg,#ff8a65,#c62828)',
  2: 'linear-gradient(160deg,#f2f5f9,#9aa7b8)',
  3: 'linear-gradient(160deg,#f0c08a,#a1652f)',
};

function AvatarStack({ people, total }) {
  return (
    <span className="flex items-center gap-1">
      <span className="flex items-center">
        {people.map((person, index) => (
          <span
            key={person.user_id}
            className="h-5 w-5 overflow-hidden rounded-full border border-[#e8c47c]/45 bg-black/70"
            style={{ marginLeft: index ? -6 : 0 }}
          >
            {person.avatar ? (
              <Image src={person.avatar} className="h-full w-full" fittingType="fill" alt="" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[8px] font-bold text-white">{(person.name || '?')[0]}</span>
            )}
          </span>
        ))}
      </span>
      {total > people.length && <span className="text-[9px] font-bold text-white/60">+{total - people.length}</span>}
    </span>
  );
}

/** Ana sayfa keşfet ızgarasındaki oda kartı: madalyalı, metalik altın çerçeveli dikey kart. */
function RoomDiscoveryCard({ room, owner, kind, filmTitle, friendInside, rank = 0 }) {
  const { user } = useCurrentUser();
  const viewers = room.participants?.length || 0;
  // İçeride kimse yoksa oda kilitlidir: sahibi odaya girene kadar kimse içeri alınmaz.
  const locked = viewers === 0 && user?.id !== room.owner_id;
  const isVoice = kind === 'voice';
  const isHidden = room.hidden === true;
  const videoId = isVoice ? '' : youtubeIdFromMovieId(room.movie_id);
  const cover = isVoice ? owner?.avatar : videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
  const people = (room.participants || []).slice(0, isHidden ? 2 : 4);
  const ownerName = owner?.username || owner?.full_name || room.owner_name || 'Kullanıcı';
  const category = room.category || '';
  const CategoryIcon = CATEGORY_ICONS[category] || null;
  const statusLine = isVoice ? (room.announcement || category || 'Sesli sohbet odası') : (filmTitle || 'Film odası');
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
      className="relative flex flex-col overflow-hidden rounded-[16px] bg-[#10141d] transition-transform active:scale-[0.98]"
      style={{
        boxShadow:
          '0 0 0 1.5px rgba(216,180,106,0.95), 0 0 0 3px rgba(9,14,24,0.98), 0 0 18px -6px rgba(108,212,214,0.45), 0 14px 24px -18px rgba(0,0,0,0.95)',
      }}
    >
      {/* Metalik iç çerçeve ve köşe pirinçleri. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 rounded-[16px]"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(247,229,186,0.4), inset 0 0 18px rgba(108,212,214,0.12)' }}
      />
      {['left-1 top-1', 'right-1 top-1', 'left-1 bottom-1', 'right-1 bottom-1'].map((corner) => (
        <span
          key={corner}
          aria-hidden="true"
          className={`pointer-events-none absolute z-20 h-1.5 w-1.5 rotate-45 ${corner}`}
          style={{ background: 'linear-gradient(135deg,#fff3cf,#d9b168)', boxShadow: '0 0 6px rgba(240,214,154,0.9)' }}
        />
      ))}

      {/* Görsel alanı: kartın üst bölümü. */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4 / 5' }}>
        {cover ? (
          <Image src={cover} className="absolute inset-0 h-full w-full" fittingType="fill" alt="" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#173a5e] to-[#0a1220]">
            {isVoice ? <Mic className="h-7 w-7 text-[#e8c47c]/60" /> : <Film className="h-7 w-7 text-[#e8c47c]/60" />}
          </span>
        )}
        <span
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: 'linear-gradient(to top, rgba(16,20,29,0.95), transparent)' }}
        />

        {/* Madalya: en çok izlenen ilk üç oda. */}
        {rank > 0 && RANK_STYLE[rank] && (
          <span
            className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/60 text-[10px] font-black text-white"
            style={{ background: RANK_STYLE[rank], boxShadow: '0 2px 8px rgba(0,0,0,0.55)' }}
          >
            {rank}
          </span>
        )}

        {/* Sağ üst: kategori ve arkadaş işareti. */}
        {(category || friendInside) && (
          <span className="absolute right-1.5 top-1.5 flex max-w-[85%] flex-col items-end gap-1">
            {category && (
              <span
                title={`Kategori: ${category}`}
                className="flex items-center gap-1 rounded-full border border-[#e8c47c]/60 bg-black/75 px-1.5 py-0.5 text-[8.5px] font-black text-[#ffe6a8]"
              >
                {CategoryIcon && <CategoryIcon className="h-2.5 w-2.5" />}
                {category}
              </span>
            )}
            {friendInside && (
              <span
                title="Arkadaşın"
                className="flex items-center gap-1 rounded-full border border-[#e8c47c]/60 bg-black/80 px-1.5 py-0.5 text-[8.5px] font-black text-[#e8c47c]"
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} /> Ekli
              </span>
            )}
          </span>
        )}

        {/* Canlı etiketi görselin sol altında durur. */}
        <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full border border-white/25 bg-gradient-to-r from-[#c62828] to-[#ef5350] px-1.5 py-0.5 text-[8.5px] font-black tracking-wide text-white shadow-[0_0_10px_-3px_rgba(198,40,40,0.95)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> CANLI
        </span>
        {isHidden && (
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/80 px-1.5 py-0.5 text-[8.5px] font-black text-[#e8c47c]">
            <EyeOff className="h-2.5 w-2.5" /> Gizli
          </span>
        )}

        {locked && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/72">
            <Lock className="h-5 w-5 text-[#e8c47c]" />
            <span className="text-[9px] font-black tracking-wide text-[#e8c47c]">ODA KİLİTLİ</span>
            <span className="text-[8.5px] font-semibold text-white/60">Sahibi odada değil</span>
          </span>
        )}
      </div>

      {/* Bilgi şeridi: sohbet ikonu, kişiler ve izleyici sayısı. */}
      <div className="flex items-center gap-1.5 border-t border-[#e8c47c]/20 bg-[#0b0f17] px-2 py-1">
        <MessageSquare className="h-3 w-3 shrink-0 text-[#6cd4d6]" />
        <AvatarStack people={people} total={viewers} />
        <span className="ml-auto flex shrink-0 items-center gap-0.5 text-[10px] font-extrabold tabular-nums text-white">
          {viewers}
          <BarChart3 className="h-3 w-3 text-[#e8c47c]" />
        </span>
      </div>

      {/* Alt bölüm: oda sahibi ve durum satırı. */}
      <div className="flex min-w-0 flex-col gap-0.5 px-2 pb-1.5 pt-1">
        <span className="flex items-center gap-1">
          {owner?.avatar ? (
            <Image src={owner.avatar} className="h-3.5 w-3.5 shrink-0 overflow-hidden rounded-full border border-[#e8c47c]/50" fittingType="fill" alt="" />
          ) : (
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f2d9a0] to-[#a1652f] text-[7px] font-black text-black">
              {(ownerName || '?')[0]}
            </span>
          )}
          <span className="truncate text-[11.5px] font-extrabold text-white">{room.name}</span>
          {room.password && <Lock className="h-2.5 w-2.5 shrink-0 text-[#e8c47c]" />}
        </span>
        <span className="flex items-center gap-1">
          <span className="truncate text-[9.5px] font-semibold text-white/65">{statusLine}</span>
          <span className="ml-auto shrink-0 rounded-full border border-[#6cd4d6]/50 px-1.5 text-[8.5px] font-black text-[#7ff0e6]">
            {isVoice ? 'Sesli' : 'Film'}
          </span>
        </span>
      </div>
    </Link>
  );
}

// Kart yalnızca kendi verisi değiştiğinde yeniden çizilir: liste tazelenirken ızgara akıcı kalır.
export default memo(RoomDiscoveryCard);