import { useState } from 'react';
import { Camera, Check, Copy, Crown, Heart, Loader2, Shield, Star } from 'lucide-react';
import ProfileAvatarPortrait from '@/components/profile/fantasy/ProfileAvatarPortrait';
import ProfileAgencyBadges from '@/components/profile/ProfileAgencyBadges';
import { useToast } from '@/components/ui/use-toast';
import { badgesFromUser, isRedNameVip, receivedColor, sentColor, vipDaysLeft, N_BADGE_STYLE } from '@/lib/userLevels';


const RING = 'conic-gradient(from 140deg, #e0f2fe, #7dd3fc, #f8fafc, #38bdf8, #dbeafe, #60a5fa, #e0f2fe)';


/** Profil başlığı: kristal çerçeveli avatar, isim, kimlik no ve rozet şeridi. */
export default function ProfileHeroCard({ user, avatar, onAvatar, uploading, vipLevel = 0 }) {
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const name = user.username || user.full_name || 'Kullanıcı';
  // N (isim), atış ve alış seviyeleri kayıttaki hediye toplamlarından hesaplanır.
  const badges = badgesFromUser(user);
  const male = user.gender === 'erkek';
  const female = !!user.gender && !male;

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
    <section className="relative px-4 pt-6">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <span className="block rounded-full p-[4px]" style={{ background: RING, boxShadow: '0 0 20px rgba(125,211,252,0.55), 0 0 42px rgba(56,189,248,0.3)' }}>
            <ProfileAvatarPortrait avatar={avatar || user.avatar} name={name} />
          </span>
          {vipLevel > 0 && (
            <span
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-md px-2 py-[2px] text-[10px] font-black tracking-wide text-white"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #7dd3fc)', boxShadow: '0 0 10px rgba(56,189,248,0.6)' }}
            >
              VIP{vipLevel}
            </span>
          )}
          {!picking && (
            <button
              type="button"
              onClick={() => setPicking(true)}
              aria-label="Profil fotoğrafını düzenle"
              className="absolute -right-1 top-0 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-[#7dd3fc]/60 text-white active:scale-95"
              style={{ background: 'linear-gradient(135deg, #1e3a8a, #38bdf8)' }}
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-lg font-extrabold" style={isRedNameVip(vipLevel) ? { color: '#ef4444' } : undefined}>{name}</h2>
            {male && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2E7DFF] text-[10px] font-black text-white">♂</span>}
            {female && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF006E] text-[10px] font-black text-white">♀</span>}
            <span className="text-sm leading-none">🇹🇷</span>
          </div>

          <button type="button" onClick={copyId} className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-white/75 active:scale-95">
            ID:{user.member_id || '—'}
            {copied ? <Check className="h-3.5 w-3.5 text-[#7dd3fc]" /> : <Copy className="h-3.5 w-3.5 text-white/60" />}
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

      <div className="mt-3"><ProfileAgencyBadges profile={user} /></div>
      {picking && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#7dd3fc]/50 bg-[#0B2A52]/70 px-3.5 py-1.5 text-xs font-semibold text-white">
              {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Hareketli (GIF)
              <input type="file" accept="image/gif" className="hidden" disabled={uploading} onChange={onAvatar} />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#7dd3fc]/50 bg-[#0B2A52]/70 px-3.5 py-1.5 text-xs font-semibold text-white">
              {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Hareketsiz
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={onAvatar} />
            </label>
          </div>
          <button type="button" onClick={() => setPicking(false)} className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white">
            Kapat
          </button>
        </div>
      )}
    </section>
  );
}