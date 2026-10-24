import { useMemo } from 'react';
import { Image } from '@/components/ui/image';
import { isHiddenName } from '@/lib/hiddenUser';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useKeyedImage from '@/hooks/useKeyedImage';
import RoomNameMarquee from '@/components/voice/RoomNameMarquee';

const ART_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/7c8894234_IMG_0281.jpg';
const W = 736;
const H = 195;
// Kaynak görseldeki iç çember: maske ve fotoğraf aynı merkezi ve çapı kullanır.
const PORTRAIT = { cx: 74.5, cy: 84, r: 38 };
// Örnek isim, ID, hediye sayısı ve izleyici sayısı görselden silinir.
const CROP = {
  top: 0, height: H / 1007, baseWidth: W,
  erase: [[132, 52, 100, 36], [132, 90, 145, 24], [165, 138, 60, 34], [488, 84, 26, 30]],
  holes: [[PORTRAIT.cx, PORTRAIT.cy, PORTRAIT.r]],
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
    <div className="voice-header-art relative w-full" style={{ aspectRatio: `${W} / ${H}`, containerType: 'inline-size' }}>
      {/* Fotoğraf çerçevenin ARKASINDA durur: çember dışına taşan kısım çerçeve altında kalır. */}
      <div className="pointer-events-none overflow-hidden rounded-full" style={{ ...pct(PORTRAIT.cx - PORTRAIT.r, PORTRAIT.cy - PORTRAIT.r, PORTRAIT.r * 2, PORTRAIT.r * 2), clipPath: 'circle(50% at 50% 50%)' }}>
        {profile.avatar
          ? <Image src={profile.avatar} alt={ownerName} className="h-full w-full" fittingType="fill" draggable={false} />
          : <span className="flex h-full w-full items-center justify-center text-lg font-bold text-white">{ownerName.trim().charAt(0)}</span>}
      </div>
      {src && <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />}
      <button type="button" onClick={onOpen} aria-label="Oda profilini aç" className="rounded-full" style={pct(PORTRAIT.cx - PORTRAIT.r, PORTRAIT.cy - PORTRAIT.r, PORTRAIT.r * 2, PORTRAIT.r * 2)} />
      <button type="button" onClick={onOpen} className="flex flex-col justify-center overflow-hidden text-left" style={pct(132, 50, 200, 66)}>
        <RoomNameMarquee text={room?.name || 'Oda'} className="w-full shrink-0 !py-0 text-[3.65cqw] font-bold leading-[1.2] text-white" />
        {memberId && <span className="flex shrink-0 items-center gap-1 text-[2.7cqw] leading-[1.2] tabular-nums text-white/75">ID:{memberId}<span className="h-[1.4cqw] w-[1.4cqw] shrink-0 rounded-full bg-emerald-400" /></span>}
      </button>
      <button type="button" onClick={onOpenGifts} aria-label="Hediye sıralaması" className="flex items-center text-left" style={pct(60, 138, 300, 36)}>
        <span className="ml-[37%] text-[clamp(13px,4.2vw,20px)] font-bold tabular-nums text-white">{score}</span>
      </button>
      <button type="button" onClick={onOpenViewers} aria-label="İzleyiciler" className="rounded-full" style={pct(440, 60, 82, 78)} />
      <span className="pointer-events-none flex items-center justify-center text-[clamp(12px,3.8vw,18px)] font-bold leading-none tabular-nums text-white" style={pct(486, 84, 30, 30)}>{viewerCount}</span>
      <button type="button" onClick={onOpenMenu} aria-label="Oda menüsü" className="rounded-full" style={pct(530, 60, 78, 78)} />
      <button type="button" onClick={onExit} aria-label="Odadan çık" className="rounded-full" style={pct(614, 60, 78, 78)} />
    </div>
  );
}