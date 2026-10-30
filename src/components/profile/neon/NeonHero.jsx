import { useState } from 'react';
import { BadgeCheck, Camera, Check, Copy, Crown, Heart, Loader2, Shield, Star } from 'lucide-react';
import ProfileAvatarPortrait from '@/components/profile/fantasy/ProfileAvatarPortrait';
import { useToast } from '@/components/ui/use-toast';
import { badgesFromUser, vipDaysLeft, vipLevelOf } from '@/lib/userLevels';
import { broadcasterState } from '@/lib/broadcaster';
import NeonPanel from '@/components/profile/neon/NeonPanel';

const PILL = 'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-black text-white';

/** Profil başlığı: taçlı avatar, isim, kimlik ve seviye rozetleri. */
export default function NeonHero({ user, avatar, onAvatar, uploading }) {
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const name = user.username || user.full_name || 'Kullanıcı';
  const badges = badgesFromUser(user);
  const vipLevel = vipLevelOf(user);
  const days = vipDaysLeft(user);
  const verified = user.role === 'admin' || user.official === true;
  const owned = !!user.owned_agency_id || user.agency_role === 'owner';
  const owner = owned && user.owned_agency_status !== 'pending' && user.owned_agency_status !== 'rejected';
  const broadcaster = broadcasterState(user).active;
  const male = user.gender === 'erkek';

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
    <NeonPanel innerClassName="px-3.5 py-4">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0 pt-3">
          <Crown className="absolute -top-0.5 left-1/2 h-5 w-5 -translate-x-1/2 text-[#ffd166] drop-shadow-[0_0_6px_rgba(255,190,60,0.9)]" fill="#ffd166" aria-hidden="true" />
          <span className="profile-flame-glow neon-avatar-ring block rounded-full p-[3px]">
            <ProfileAvatarPortrait avatar={avatar || user.avatar} name={name} />
          </span>
          {vipLevel > 0 && (
            <span
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2 py-[1px] text-[10px] font-black tracking-wide text-[#1b1204]"
              style={{ background: 'linear-gradient(135deg, #fff0b8, #ffc247 55%, #d08b1f)', boxShadow: '0 0 12px rgba(255,200,70,0.8)' }}
            >
              VIP{vipLevel}
            </span>
          )}
          {!picking && (
            <button
              type="button"
              onClick={() => setPicking(true)}
              aria-label="Profil fotoğrafını düzenle"
              className="absolute -right-1 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-[#7dd3fc]/70 bg-[#0b2a52]/90 text-white active:scale-95"
            >
              <Camera className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="min-w-0 truncate text-[19px] font-black uppercase leading-tight tracking-wide text-white drop-shadow-[0_0_10px_rgba(255,140,40,0.55)]">{name}</h1>
            {verified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#38bdf8]" fill="#38bdf8" stroke="#0b2a52" aria-label="Onaylı hesap" />}
            {male && <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2E7DFF] text-[10px] font-black text-white">♂</span>}
            <span className="shrink-0 text-sm leading-none">🇹🇷</span>
          </div>

          <button type="button" onClick={copyId} className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-white/80 active:scale-95">
            ID:{user.member_id || '—'}
            {copied ? <Check className="h-3.5 w-3.5 text-[#7dd3fc]" /> : <Copy className="h-3.5 w-3.5 text-white/60" />}
          </button>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {badges.n_level > 0 && (
              <span className={PILL} style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', boxShadow: '0 0 10px rgba(56,189,248,0.6)' }}>
                <Shield className="h-3 w-3" strokeWidth={2.8} /> N{badges.n_level}
              </span>
            )}
            {badges.gift_sent_level > 0 && (
              <span className={PILL} style={{ background: 'linear-gradient(135deg, #b45309, #f59e0b)', boxShadow: '0 0 10px rgba(245,158,11,0.55)' }}>
                <Star className="h-3 w-3" fill="currentColor" /> Atış {badges.gift_sent_level}
              </span>
            )}
            {badges.gift_received_level > 0 && (
              <span className={PILL} style={{ background: 'linear-gradient(135deg, #be123c, #fb7185)', boxShadow: '0 0 10px rgba(251,113,133,0.55)' }}>
                <Heart className="h-3 w-3" fill="currentColor" /> Alış {badges.gift_received_level}
              </span>
            )}
          </div>

          {vipLevel > 0 && (
            <span
              className="mt-1.5 inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-black text-[#1b1204]"
              style={{ background: 'linear-gradient(135deg, #fff3c4, #ffd166 46%, #c9962a)', boxShadow: '0 0 14px rgba(255,209,102,0.55)' }}
            >
              <Crown className="h-3 w-3" fill="currentColor" /> VIP{vipLevel}
              <span className="font-bold opacity-75">· {days ? `${days} gün` : 'süresiz'}</span>
            </span>
          )}
        </div>
      </div>

      {(owner || broadcaster) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {owner && (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#ff6b2c]/80 bg-[#3a1206]/70 px-3 text-[11px] font-black uppercase tracking-wide text-[#ffd6a8] shadow-[0_0_14px_rgba(255,90,30,0.35)]">
              <Crown className="h-3.5 w-3.5" /> Ajans Sahibi
            </span>
          )}
          {broadcaster && (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#ff6b2c]/80 bg-[#3a1206]/70 px-3 text-[11px] font-black uppercase tracking-wide text-[#ffd6a8] shadow-[0_0_14px_rgba(255,90,30,0.35)]">
              <Star className="h-3.5 w-3.5" /> Yayıncı
            </span>
          )}
        </div>
      )}

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
    </NeonPanel>
  );
}