import { useState } from 'react';
import { Camera, Check, Copy, Feather, Loader2, Shield } from 'lucide-react';
import XpAvatar from '@/components/xp/XpAvatar';
import useXp from '@/hooks/useXp';
import { useToast } from '@/components/ui/use-toast';
import { isRedNameVip } from '@/lib/userLevels';
import { formatCoins } from '@/lib/giftTone';

const RING = 'conic-gradient(from 140deg, #e0f2fe, #7dd3fc, #f8fafc, #38bdf8, #dbeafe, #60a5fa, #e0f2fe)';
const PANEL = 'rgba(10, 32, 66, 0.72)';

/** Profil başlığı: kristal çerçeveli avatar, isim, kimlik no ve rozet şeridi. */
export default function ProfileHeroCard({ user, avatar, onAvatar, onEdit, uploading, gems, vipLevel = 0, onOpenGems }) {
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const xpStats = useXp([user.id])[user.id];
  const name = user.username || user.full_name || 'Kullanıcı';
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
      <button
        type="button"
        onClick={onEdit}
        aria-label="Profil bilgilerini düzenle"
        className="absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-[#7dd3fc]/40 bg-[#0B2A52]/70 text-[#a5e4ff] active:scale-95"
        style={{ boxShadow: '0 0 14px rgba(56,189,248,0.35)' }}
      >
        <Feather className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <span className="block rounded-full p-[4px]" style={{ background: RING, boxShadow: '0 0 20px rgba(125,211,252,0.55), 0 0 42px rgba(56,189,248,0.3)' }}>
            <XpAvatar avatar={avatar || user.avatar} name={name} frame={xpStats?.frame} size="xl" />
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
            <h2 className="truncate text-lg font-extrabold" style={isRedNameVip(user.vip_level) ? { color: '#ef4444' } : undefined}>{name}</h2>
            {male && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2E7DFF] text-[10px] font-black text-white">♂</span>}
            {female && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF006E] text-[10px] font-black text-white">♀</span>}
            <span className="text-sm leading-none">🇹🇷</span>
          </div>

          <button type="button" onClick={copyId} className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-white/75 active:scale-95">
            ID:{user.member_id || '—'}
            {copied ? <Check className="h-3.5 w-3.5 text-[#7dd3fc]" /> : <Copy className="h-3.5 w-3.5 text-white/60" />}
          </button>

          <div className="mt-2 flex items-center gap-1.5">
            <span className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[10px] font-black text-white" style={{ background: 'rgba(37,99,235,0.55)', border: '1px solid rgba(125,211,252,0.6)' }}>
              <Shield className="h-3 w-3 text-[#bae6fd]" fill="currentColor" /> VIP{vipLevel || 0}
            </span>
            <button type="button" onClick={onOpenGems} className="flex h-6 items-center gap-1 rounded-md px-1.5 tabular-nums text-white active:scale-95" style={{ background: PANEL, border: '1px solid rgba(125,211,252,0.45)' }}>
              <span className="text-[10px] text-[#7dd3fc]">◆</span>
              <span className="text-[9px] font-black tracking-[0.08em] text-[#a5e4ff]">ELMASLAR</span>
              <span className="text-[11px] font-black">{gems === null || gems === undefined ? '—' : formatCoins(gems)}</span>
            </button>
          </div>
        </div>
      </div>

      {picking && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#7dd3fc]/50 bg-[#0B2A52]/70 px-3.5 py-1.5 text-xs font-semibold text-white">
            {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Fotoğraf Seç
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={onAvatar} />
          </label>
          <button type="button" onClick={() => setPicking(false)} className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white">
            Kapat
          </button>
        </div>
      )}
    </section>
  );
}