import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Coins, Gem } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useRoomLevels from '@/hooks/useRoomLevels';
import { Image } from '@/components/ui/image';
import { formatCoins } from '@/lib/giftTone';
import { formatScore } from '@/components/voice/scoreTier';

/**
 * Ana sayfa üst şeridi: profil fotoğrafı, kullanıcı adı, seviye (LVL), coins ve elmas.
 * Şeridin tamamı profil sayfasına gider.
 */
export default function HomeHero() {
  const { user } = useCurrentUser();
  const [wallet, setWallet] = useState(null);
  const levels = useRoomLevels(user?.id ? [user.id] : []);

  // Coins ve elmas, profil sayfasıyla aynı kaynaktan okunur.
  useEffect(() => {
    base44.functions.invoke('gift-box', { action: 'summary' })
      .then((response) => setWallet(response.data))
      .catch(() => {});
  }, []);

  if (!user) return null;

  const name = user.username || user.full_name || 'Kullanıcı';
  const level = Math.max(0, Math.floor(Number(levels[user.id]) || 0));
  const levelText = level >= 1000 ? 'LVL MAX' : `LVL ${level}`;
  const coins = wallet ? formatCoins(wallet.coins) : '—';
  const gems = wallet ? formatScore(wallet.month_score) : '—';

  return (
    <Link
      to="/profil"
      className="premium-panel flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-transform active:scale-[0.99]"
    >
      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-premium-gold/50 bg-black/40 shadow-[0_0_14px_-4px_rgba(212,175,55,0.75)]">
        {user.avatar ? (
          <Image src={user.avatar} alt={name} fittingType="fill" className="h-full w-full" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-black text-premium-gold">
            {name[0]}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-extrabold text-white">{name}</span>
        <span className="mt-1 flex items-center gap-1.5">
          <span className="shrink-0 rounded-md bg-gradient-to-r from-premium-gold-light to-premium-gold px-1.5 py-[2px] text-[9.5px] font-black text-black shadow-[0_0_10px_-2px_rgba(212,175,55,0.85)]">
            {levelText}
          </span>
          {user.member_id && <span className="truncate text-[10px] font-semibold text-white/40">#{user.member_id}</span>}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-1.5">
        <Stat icon={Coins} value={coins} />
        <Stat icon={Gem} value={gems} />
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-premium-gold/70" />
    </Link>
  );
}

/** Coins / elmas kutusu: altın ikon, beyaz değer. */
function Stat({ icon: Icon, value }) {
  return (
    <span className="flex flex-col items-center gap-0.5 rounded-xl border border-premium-gold/25 bg-black/30 px-2 py-1">
      <Icon className="h-3.5 w-3.5 text-premium-gold" />
      <span className="text-[10px] font-extrabold leading-none tabular-nums text-white">{value}</span>
    </span>
  );
}