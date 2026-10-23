import { Crown, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { vipLook } from '@/components/vip/vipTheme';

/**
 * Profil kartındaki VIP şeridi: yalnızca VIP rozeti takılıyken görünür.
 * Rozet çıkarıldığında kartta hiçbir VIP izi kalmaz.
 */
export default function VipShowcase({ profile }) {
  const theme = vipLook(profile, 'badge');
  const level = Number(profile?.vip_level) || 0;
  if (!theme || level < 5) return null;
  const accent = theme.accent || '#ffd166';
  const secondary = theme.secondary || '#fff2c2';
  const days = Number(profile?.vip_days_left) || 0;
  return (
    <div
      className="vip-showcase relative mx-auto mt-2 flex w-full max-w-[268px] items-center gap-2 overflow-hidden rounded-2xl border px-2.5 py-1.5"
      style={{
        borderColor: secondary,
        background: `linear-gradient(120deg, rgba(6,8,20,0.94), ${accent}30)`,
        boxShadow: `0 0 20px -8px ${accent}, inset 0 0 18px -12px ${secondary}`,
      }}
    >
      <span className="vip-showcase-sweep" aria-hidden="true" />
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border" style={{ borderColor: secondary, background: `${accent}26` }}>
        {theme.image
          ? <Image src={theme.image} alt="" className="h-8 w-8 rounded-full" />
          : <Crown className="h-4 w-4" style={{ color: secondary }} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-[13px] font-black leading-none" style={{ color: secondary }}>
          <Crown className="h-3.5 w-3.5" fill="currentColor" />VIP {level}
        </span>
        <span className="mt-1 block truncate text-[9px] font-bold uppercase tracking-[0.16em] text-white/55">
          {theme.name || 'Ayrıcalıklı Üye'} · {days > 0 ? `${days} gün kaldı` : 'süresiz'}
        </span>
      </span>
      <Sparkles className="h-4 w-4 shrink-0" style={{ color: accent }} />
    </div>
  );
}