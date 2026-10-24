import { useWhiteCutout } from '@/lib/whiteCutout';
import useBannerBadges from '@/components/friends/BannerBadges';

const BANNER = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/4eb14dbda_IMG_0154.jpg';
const HOT = 'absolute inset-0 h-full w-full opacity-0';

const Dot = ({ count }) => count > 0 ? (
  <span className="pointer-events-none absolute -right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-black/60">{count > 9 ? '9+' : count}</span>
) : null;

/** Ana sayfadaki mesajlar şeridinin oda içinde kullanılan kopyası: aynı görsel ve
    sağdaki üç dokunma alanı (istekler, sistem bildirimi, ajans mesajları).
    Sayfaya gitmek yerine verilen işlevleri çağırır: oda terk edilmez. */
export default function MessagesBannerInline({ relations = [], userId, onOpenRequests, onOpenNotes, onOpenAgency }) {
  const src = useWhiteCutout(BANNER);
  const badges = useBannerBadges(userId, relations);
  return (
    <div className="relative w-full shrink-0" style={{ aspectRatio: '1024 / 342' }}>
      {src && <img src={src} alt="Mesajlar" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute" style={{ left: '58.5%', top: '25%', width: '13.5%', height: '50%' }}>
        <button type="button" onClick={onOpenRequests} aria-label="İstekler" className={HOT} />
        <Dot count={badges.requests} />
      </div>
      <div className="absolute" style={{ left: '72.5%', top: '25%', width: '13.5%', height: '50%' }}>
        <button type="button" onClick={onOpenNotes} aria-label="Sistem bildirimleri" className={HOT} />
        <Dot count={badges.notes} />
      </div>
      <div className="absolute" style={{ left: '86.5%', top: '25%', width: '13%', height: '50%' }}>
        <button type="button" onClick={onOpenAgency} aria-label="Ajans mesajları" className={HOT} />
        <Dot count={badges.agency} />
      </div>
    </div>
  );
}