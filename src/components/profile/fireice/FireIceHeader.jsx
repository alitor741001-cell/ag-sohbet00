import { useState } from 'react';
import { Camera, Check, ChevronDown, Copy, Crown, Eye, Loader2, LogOut, Pencil, Settings, Shield, Signal } from 'lucide-react';
import ProfileAvatarPortrait from '@/components/profile/fantasy/ProfileAvatarPortrait';
import ProfileLaurel from '@/components/profile/fireice/ProfileLaurel';
import FireFrame from '@/components/profile/fireice/FireFrame';
import DragonHead from '@/components/profile/fireice/DragonHead';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { badgesFromUser, vipDaysLeft } from '@/lib/userLevels';

/** Profil başlığı: defne çelenkli avatar, isim kutusu ve sağ üstte ejderha başı. */
export default function FireIceHeader({
  user, avatar, uploading, onAvatar, vipLevel = 0,
  liveRoom, viewers = 0, isAdmin, onEdit, onSettings, onAdmin, onLogout,
}) {
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const name = user?.username || user?.full_name || 'Kullanıcı';
  const badges = badgesFromUser(user);
  const days = vipDaysLeft(user);
  const live = !!liveRoom;

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
    <section className="relative pr-9">
      <DragonHead className="fi-dragon pointer-events-none absolute -right-1 -top-1 h-12 w-12" />

      <div className="flex items-start gap-1.5">
        <div className="relative shrink-0 pt-4">
          <ProfileLaurel className="pointer-events-none absolute -inset-1.5 h-[calc(100%+12px)] w-[calc(100%+12px)]" />
          <Crown className="absolute left-1/2 top-0 z-10 h-5 w-5 -translate-x-1/2 text-[#ffd166] drop-shadow-[0_0_6px_rgba(255,190,60,0.9)]" fill="currentColor" />
          <span
            className="relative block rounded-full p-[3px]"
            style={{
              background: 'conic-gradient(from 140deg, #ffe9a8, #ff7a18, #2ee6ff, #0069ff, #ffe9a8)',
              boxShadow: '0 0 16px rgba(46,230,255,0.5), 0 0 24px rgba(255,122,24,0.35)',
            }}
          >
            <ProfileAvatarPortrait avatar={avatar || user.avatar} name={name} />
          </span>
          {vipLevel > 0 && (
            <span
              className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-md px-1.5 py-[1px] text-[9px] font-black tracking-wide text-[#1b1204]"
              style={{ background: 'linear-gradient(135deg, #fff0b8, #ffc247 55%, #d08b1f)', boxShadow: '0 0 10px rgba(255,200,70,0.75)' }}
            >
              VIP{vipLevel}
            </span>
          )}
          {!picking && (
            <button
              type="button"
              onClick={() => setPicking(true)}
              aria-label="Profil fotoğrafını düzenle"
              className="absolute -right-1 top-4 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-[#2ee6ff]/70 bg-[#0a1a34] text-white active:scale-95"
            >
              <Camera className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <FireFrame innerClassName="px-2.5 py-2" className="mr-1">
            <div className="flex items-start gap-1.5">
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[17px] font-black leading-tight text-white">{name}</h1>
                <button type="button" onClick={copyId} className="mt-0.5 flex items-center gap-1 text-[10.5px] font-semibold text-white/70 active:scale-95">
                  ID:{user.member_id || '—'}
                  {copied ? <Check className="h-3 w-3 text-[#2ee6ff]" /> : <Copy className="h-3 w-3 text-white/50" />}
                </button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Hesap menüsü"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#2ee6ff]/50 bg-[#0a1a34]/80 text-white active:scale-95"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-3.5 w-3.5" /> Bilgilerimi düzenle</DropdownMenuItem>
                  <DropdownMenuItem onClick={onSettings}><Settings className="mr-2 h-3.5 w-3.5" /> Eklentiler</DropdownMenuItem>
                  {isAdmin && <DropdownMenuItem onClick={onAdmin}><Shield className="mr-2 h-3.5 w-3.5" /> Yönetim Paneli</DropdownMenuItem>}
                  <DropdownMenuItem onClick={onLogout}><LogOut className="mr-2 h-3.5 w-3.5" /> Çıkış Yap</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <span
                className="flex h-5 items-center gap-1 rounded-md px-1.5 text-[9.5px] font-black text-white"
                style={{ border: `1px solid ${live ? 'rgba(255,209,102,0.8)' : 'rgba(255,255,255,0.22)'}`, background: live ? 'rgba(120,53,15,0.6)' : 'rgba(255,255,255,0.06)' }}
              >
                <Signal className={`h-2.5 w-2.5 ${live ? 'text-[#ffd166]' : 'text-white/50'}`} />
                {live ? 'Yayında' : 'Çevrim dışı'}
                {live && (
                  <>
                    <Eye className="h-2.5 w-2.5 text-white/80" />
                    {viewers.toLocaleString('tr-TR')}
                  </>
                )}
              </span>
              {badges.n_level > 0 && (
                <span className="rounded-md border border-[#2ee6ff]/50 bg-[#0b2a52]/80 px-1.5 py-[1px] text-[9.5px] font-black text-[#d6f7ff]">N{badges.n_level}</span>
              )}
              {vipLevel > 0 && (
                <span className="rounded-md border border-[#ffd166]/60 bg-[#3a2205]/70 px-1.5 py-[1px] text-[9.5px] font-black text-[#ffe9a8]">
                  {days ? `${days} gün` : 'süresiz'}
                </span>
              )}
            </div>
          </FireFrame>
        </div>
      </div>

      {picking && (
        <div className="mt-2 flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#2ee6ff]/50 bg-[#0a1a34]/80 px-3.5 py-1.5 text-xs font-semibold text-white">
              {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Hareketli (GIF)
              <input type="file" accept="image/gif" className="hidden" disabled={uploading} onChange={onAvatar} />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#ff9a3c]/60 bg-[#2a1206]/80 px-3.5 py-1.5 text-xs font-semibold text-white">
              {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Hareketsiz
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={onAvatar} />
            </label>
          </div>
          <button type="button" onClick={() => setPicking(false)} className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-[11px] font-semibold text-white">
            Kapat
          </button>
        </div>
      )}
    </section>
  );
}