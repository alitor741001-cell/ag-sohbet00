import { Crown, Eye, Heart, MessageSquare, MoreVertical, Signal, Star } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const RING = 'conic-gradient(from 140deg, #ff00ff, #8a2be2, #7dd3fc, #00ffff, #ff00ff)';

/** Profil üst şeridi: neon halkalı avatar, isim ve yayın durumu.
    Yayındayken altında 2. tasarımdaki "Yayına Katıl" düğmesi görünür. */
export default function ProfileLivePanel({ user, avatar, liveRoom, viewers = 0, onChat, onJoin, onEdit, onSettings }) {
  const name = user?.username || user?.full_name || 'Kullanıcı';
  const live = !!liveRoom;
  const count = (viewers || 0).toLocaleString('tr-TR');

  return (
    <section
      aria-label="Profil durumu"
      className="relative overflow-hidden rounded-[26px] px-3 py-3"
      style={{
        background: 'linear-gradient(158deg, rgba(10,10,42,0.94), rgba(6,8,28,0.96))',
        border: '1px solid rgba(0,123,255,0.6)',
        boxShadow: '0 0 20px rgba(0,123,255,0.35), inset 0 0 26px rgba(138,43,226,0.16)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {live && <span className="absolute -left-1.5 -top-1 z-10 text-[15px] leading-none drop-shadow-[0_0_6px_rgba(255,215,0,0.9)]">👑</span>}
          <span className="block rounded-full p-[3px]" style={{ background: RING, boxShadow: '0 0 16px rgba(255,0,255,0.55), 0 0 30px rgba(0,191,255,0.35)' }}>
            <span className="block rounded-full p-[2px]" style={{ background: '#0a0a2a' }}>
              {avatar ? (
                <Image src={avatar} alt={name} className="h-16 w-16 rounded-full" fittingType="fill" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#150c38] text-lg font-black text-white">{(name || '?')[0]}</span>
              )}
            </span>
          </span>
          <span className="absolute -bottom-1 -right-1 text-[13px] leading-none drop-shadow-[0_0_6px_rgba(255,45,155,0.9)]">💗</span>
          {live && (
            <span
              className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md px-1.5 py-[1px] text-[8.5px] font-black tracking-wide text-white"
              style={{ background: 'linear-gradient(135deg,#ff2d9b,#a21caf)', boxShadow: '0 0 12px rgba(255,45,155,0.85)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-xl font-black leading-tight text-white" style={{ textShadow: '0 0 12px rgba(255,0,255,0.6)' }}>{name}</h3>
            <Heart className="h-4 w-4 shrink-0 text-[#ff2d55]" fill="currentColor" />
            <Star className="h-2.5 w-2.5 shrink-0 text-[#ffd700]" fill="currentColor" />
          </div>

          <div
            className="mt-1.5 flex items-center gap-1.5 rounded-full px-2 py-[3px]"
            style={{ border: '1px solid rgba(0,191,255,0.75)', background: 'rgba(6,10,40,0.92)', boxShadow: '0 0 10px rgba(0,191,255,0.35)' }}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f97316]">
              <Signal className="h-2.5 w-2.5 text-white" strokeWidth={3} />
            </span>
            <span className={`text-[11px] font-black ${live ? 'text-[#ffd700]' : 'text-white/55'}`}>{live ? 'Yayında' : 'Çevrim dışı'}</span>
            {live && <span className="h-1.5 w-1.5 rounded-full bg-[#ff2d55]" />}
            <span className="ml-1 flex items-center gap-1 text-[11px] font-bold tabular-nums text-white">
              <Eye className="h-3.5 w-3.5" /> {count}
            </span>
            <Star className="ml-auto h-3 w-3 shrink-0 text-white" fill="currentColor" />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <span className="text-[15px] leading-none drop-shadow-[0_0_6px_rgba(125,211,252,0.9)]">👑</span>
          <button
            type="button"
            onClick={onChat}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-black text-white active:scale-95"
            style={{ background: 'linear-gradient(135deg,#ff2d9b,#8a2be2)', boxShadow: '0 0 12px rgba(255,45,155,0.55)' }}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Sohbet
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Daha fazla"
                className="flex h-7 w-7 items-center justify-center rounded-full text-white active:scale-95"
                style={{ background: 'linear-gradient(135deg,#10265c,#1e3a8a)', border: '1px solid rgba(0,191,255,0.55)' }}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onEdit}>Bilgilerimi düzenle</DropdownMenuItem>
              <DropdownMenuItem onClick={onSettings}>Eklentiler</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {live && (
        <button
          type="button"
          onClick={onJoin}
          className="mt-3 flex w-full items-center gap-2 rounded-full px-3 py-2 active:scale-[0.99]"
          style={{
            background: 'linear-gradient(#0a0a2e,#0a0a2e) padding-box, linear-gradient(110deg,#ff00ff,#8a2be2 45%,#00ffff) border-box',
            border: '2px solid transparent',
            boxShadow: '0 0 16px rgba(255,0,255,0.45), 0 0 26px rgba(0,255,255,0.3)',
          }}
        >
          <span className="text-[15px] leading-none drop-shadow-[0_0_6px_rgba(255,215,0,0.9)]">👑</span>
          <span className="flex-1 text-center text-sm font-black text-white" style={{ textShadow: '0 1px 0 #6b21a8, 0 2px 10px rgba(0,191,255,0.8)' }}>
            Yayına Katıl
          </span>
          <span className="flex items-center gap-0.5">
            <span className="text-[11px] text-[#ffcc00] drop-shadow-[0_0_6px_rgba(255,204,0,0.9)]">✦</span>
            <span className="text-[11px] text-[#00ffff] drop-shadow-[0_0_6px_rgba(0,255,255,0.9)]">✦</span>
          </span>
        </button>
      )}

      <div
        className="mt-2 flex items-center justify-center gap-3 rounded-full px-3 py-1"
        style={{ border: '1px solid rgba(0,191,255,0.5)', background: 'rgba(8,14,44,0.9)' }}
        aria-hidden="true"
      >
        <Crown className="h-3 w-3 text-[#ffd700]" fill="currentColor" />
        <Star className="h-2.5 w-2.5 text-[#ffd700]" fill="currentColor" />
        <Star className="h-2.5 w-2.5 text-[#a855f7]" fill="currentColor" />
        <Star className="h-2.5 w-2.5 text-[#ffd700]" fill="currentColor" />
      </div>
    </section>
  );
}