import { useState } from 'react';
import { Camera, Check, Copy, Crown, Heart, Loader2, Shield, Star } from 'lucide-react';
import ProfileAvatarPortrait from '@/components/profile/fantasy/ProfileAvatarPortrait';
import ProfileAgencyBadges from '@/components/profile/ProfileAgencyBadges';
import { useToast } from '@/components/ui/use-toast';
import { badgesFromUser, isRedNameVip, receivedColor, sentColor, vipDaysLeft, N_BADGE_STYLE } from '@/lib/userLevels';


// Avatar halkası: kırmızı-pembe neon geçiş.
const RING = 'conic-gradient(from 140deg, #ff4d4d, #ff9f6b, #ffffff, #ff2d55, #b0122b, #ff4d4d)';


/** Profil başlığı: neon çerçeveli avatar, isim, kimlik no ve rozet şeridi. */
export default function ProfileHeroCard({ user, avatar, onAvatar, uploading, vipLevel = 0 }) {
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const name = user.username || user.full_name || 'Kullanıcı';
  // N (isim), atış ve alış seviyeleri kayıttaki hediye toplamlarından hesaplanır.
  const badges = badgesFromUser(user);
  const male = user.gender === 'erkek';
  const female = !!user.gender && !male;
  // İsim renkli yazılır: mavi-mor-turuncu-sarı ateş geçişi. Kırmızı VIP isimde korunur.
  const nameStyle = isRedNameVip(vipLevel)
    ? { color: '#ef4444', textShadow: '0 0 10px rgba(239,68,68,0.9)' }
    : {
      backgroundImage: 'linear-gradient(90deg,#4fc3ff 0%,#b900ff 38%,#ff9a3c 68%,#fff83d 100%)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
    };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(user.member_id || user.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: 'Kimlik no kopyalanamadı', variant: 'destructive' });
    }
  };

  return (
    <section className="relative px-3 pt-4">
      {/* Neon cam panel: ışıklar CSS ile çizilir, görsel yüklenmez. */}
      <div className="relative overflow-hidden rounded-[26px] border border-primary/25 bg-[#0b0a12]/85 p-3.5 shadow-[0_0_40px_-20px_rgba(239,68,68,0.95),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
        <span aria-hidden="true" className="pointer-events-none absolute -top-10 left-1/2 h-20 w-40 -translate-x-1/2 rounded-full bg-primary/30 blur-2xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -left-6 top-10 h-24 w-24 rounded-full bg-sky-500/25 blur-2xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -right-6 bottom-0 h-24 w-24 rounded-full bg-violet-500/25 blur-2xl" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />

        <div className="relative flex items-center gap-3.5">
          <div className="relative shrink-0">
            <span
              className="block rounded-full p-[3px]"
              style={{ background: RING, boxShadow: '0 0 18px rgba(239,68,68,0.75), 0 0 40px rgba(239,68,68,0.35)' }}
            >
              <ProfileAvatarPortrait avatar={avatar || user.avatar} name={name} />
            </span>
            {vipLevel > 0 && (
              <span
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-md px-2 py-[2px] text-[10px] font-black tracking-wide text-white"
                style={{ background: 'linear-gradient(135deg, #ef4343, #7a1020)', boxShadow: '0 0 12px rgba(239,68,68,0.85)' }}
              >
                VIP{vipLevel}
              </span>
            )}
            {!picking && (
              <button
                type="button"
                onClick={() => setPicking(true)}
                aria-label="Profil fotoğrafını düzenle"
                className="absolute -right-1 top-0 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-sky-200/80 text-white active:scale-95"
                style={{ background: 'linear-gradient(135deg, #4fc3ff, #6b21d6)', boxShadow: '0 0 14px rgba(107,33,214,0.85)' }}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2
                className="truncate text-lg font-extrabold text-white"
                style={nameStyle}
              >
                {name}
              </h2>
              {male && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2E7DFF] text-[10px] font-black text-white">♂</span>}
              {female && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF006E] text-[10px] font-black text-white">♀</span>}
              <span className="text-sm leading-none">🇹🇷</span>
            </div>

            <button
              type="button"
              onClick={copyId}
              className="mt-1 flex items-center gap-1.5 rounded-full border border-cyan-300/45 bg-gradient-to-r from-cyan-500/25 to-violet-500/25 px-2 py-[3px] text-[11px] font-bold text-cyan-50 shadow-[0_0_12px_-4px_rgba(79,195,255,0.9)] active:scale-95"
            >
              ID:{user.member_id || '—'}
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5 text-cyan-200/80" />}
            </button>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {badges.n_level > 0 && (
                <span className="flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-black text-white" style={{ background: N_BADGE_STYLE.background, border: `1px solid ${N_BADGE_STYLE.border}` }}>
                  <Shield className="h-3 w-3" strokeWidth={2.6} /> N{badges.n_level}
                </span>
              )}
              {badges.gift_sent_level > 0 && (
                <span className="flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-black text-white" style={{ background: sentColor(badges.gift_sent_tier), textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}>
                  <Star className="h-3 w-3" fill="currentColor" /> Atış {badges.gift_sent_level}
                </span>
              )}
              {badges.gift_received_level > 0 && (
                <span className="flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-black text-white" style={{ background: receivedColor(badges.gift_received_tier), textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}>
                  <Heart className="h-3 w-3" fill="currentColor" /> Alış {badges.gift_received_level}
                </span>
              )}
              {vipLevel > 0 && (
                <span
                  className="flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-black"
                  style={{ color: '#20160a', background: 'linear-gradient(135deg, #fff3c4, #ffd166 46%, #c9962a)', border: '1px solid #ffeab0', boxShadow: '0 0 16px rgba(255,209,102,0.5)' }}
                >
                  <Crown className="h-3 w-3" fill="currentColor" /> VIP{vipLevel}
                  <span className="font-bold opacity-70">· {vipDaysLeft(user) ? `${vipDaysLeft(user)} gün` : 'süresiz'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative mt-2.5"><ProfileAgencyBadges profile={user} /></div>

        {picking && (
          <div className="relative mt-3 flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary/50 bg-primary/12 px-3.5 py-1.5 text-xs font-semibold text-white active:scale-95">
                {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Hareketli (GIF)
                <input type="file" accept="image/gif" className="hidden" disabled={uploading} onChange={onAvatar} />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary/50 bg-primary/12 px-3.5 py-1.5 text-xs font-semibold text-white active:scale-95">
                {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Hareketsiz
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={onAvatar} />
              </label>
            </div>
            <button type="button" onClick={() => setPicking(false)} className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white active:scale-95">
              Kapat
            </button>
          </div>
        )}
      </div>
    </section>
  );
}