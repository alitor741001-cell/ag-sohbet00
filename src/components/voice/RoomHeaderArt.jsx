import { useMemo } from 'react';
import { Image } from '@/components/ui/image';
import { isHiddenName } from '@/lib/hiddenUser';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useKeyedImage from '@/hooks/useKeyedImage';

const ART_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/8c3e10240_IMG_0231.jpg';
const W = 748;
const H = 192;
// Örnek isim, ID, hediye sayısı ve izleyici sayısı görselden silinir.
const CROP = {
  top: 0, height: H / 1024, baseWidth: W,
  erase: [[132, 50, 96, 38], [132, 90, 140, 26], [168, 140, 172, 32], [492, 82, 24, 32]],
};
// Toplam hediye: her zaman 4 rakam — 1.234M, 12.34M, 123.4M; milyardan sonra B (1.234B ...).
const four = (v) => { const d = v >= 1000 ? 0 : v >= 100 ? 1 : v >= 10 ? 2 : 3; const f = 10 ** d; return (Math.floor(v * f) / f).toFixed(d); };
const formatGiftTotal = (value) => {
  const n = Math.max(0, Math.round(Number(value) || 0));
  if (n >= 1e9) return `${four(n / 1e9)}B`;
  if (n >= 1e6) return `${four(n / 1e6)}M`;
  if (n >= 1e3) return `${four(n / 1e3)}k`;
  return String(n);
};
const pct = (x, y, w, h) => ({ position: 'absolute', left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(w / W) * 100}%`, height: `${(h / H) * 100}%` });

/** Sesli oda üst başlığı: tasarım görseli, gerçek oda verileri ve dokunma alanları üstünde. */
export default function RoomHeaderArt({ room, onOpen, viewerCount = 0, onOpenViewers, onOpenMenu, onExit, giftScore = 0, onOpenGifts }) {
  const src = useKeyedImage(ART_URL, CROP);
  const ownerId = room?.owner_id;
  const ids = useMemo(() => ownerId ? [ownerId] : [], [ownerId]);
  const profile = useMessageProfiles(ids)[ownerId] || {};
  const hidden = isHiddenName(room?.owner_name);
  const ownerName = hidden ? room.owner_name : profile.username || room?.owner_name || 'Kullanıcı';
  const memberId = room?.room_number ? String(room.room_number) : (!hidden && profile.member_id && profile.member_id !== '-' ? String(profile.member_id) : '');
  const score = formatGiftTotal(giftScore);

  return (
    <div className="voice-header-art relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      {src && <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />}
      <button type="button" onClick={onOpen} aria-label="Oda profilini aç" className="overflow-hidden rounded-full" style={{ ...pct(30, 55, 64, 64), aspectRatio: '1 / 1', height: 'auto' }}>
        {profile.avatar
          ? <Image src={profile.avatar} alt={ownerName} className="h-full w-full" fittingType="fill" draggable={false} />
          : <span className="flex h-full w-full items-center justify-center text-lg font-bold text-white">{ownerName.trim().charAt(0)}</span>}
      </button>
      <button type="button" onClick={onOpen} className="flex flex-col justify-center overflow-hidden text-left" style={pct(132, 50, 200, 66)}>
        <span className="truncate text-[clamp(13px,4.2vw,20px)] font-bold leading-tight text-white">{room?.name || 'Oda'}</span>
        {memberId && <span className="mt-0.5 flex items-center gap-1 text-[clamp(10px,3vw,14px)] tabular-nums text-white/75">ID:{memberId}<span className="h-2 w-2 rounded-full bg-emerald-400" /></span>}
      </button>
      <button type="button" onClick={onOpenGifts} aria-label="Hediye sıralaması" className="flex items-center text-left" style={pct(60, 138, 300, 36)}>
        <span className="ml-[37%] text-[clamp(13px,4.2vw,20px)] font-bold tabular-nums text-white">{score}</span>
      </button>
      <button type="button" onClick={onOpenViewers} aria-label="İzleyiciler" className="flex items-center justify-end rounded-full pr-[1%]" style={pct(460, 62, 74, 72)}>
        <span className="text-[clamp(12px,3.8vw,18px)] font-bold tabular-nums text-white">{viewerCount}</span>
      </button>
      <button type="button" onClick={onOpenMenu} aria-label="Oda menüsü" className="rounded-full" style={pct(547, 62, 72, 72)} />
      <button type="button" onClick={onExit} aria-label="Odadan çık" className="rounded-full" style={pct(634, 62, 72, 72)} />
    </div>
  );
}