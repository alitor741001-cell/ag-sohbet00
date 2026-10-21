import { AtSign, ChevronRight, Copy, Gift, Heart, MessageSquare, Power, Share2, Trophy, UserPlus } from 'lucide-react';
import { Image } from '@/components/ui/image';

const TILE = 'relative flex flex-col items-center gap-[3px] active:scale-95';
const TILE_FRAME = 'relative flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#c9ebff] bg-gradient-to-b from-[#e6f6ff] via-[#93c6ee] to-[#3f74c8] text-[#123a6b] shadow-[0_0_14px_rgba(150,210,255,0.75),inset_0_1px_0_rgba(255,255,255,0.95)]';
const TILE_LABEL = 'text-[10px] font-semibold text-[#6b2038]';

const fmt = (value) => {
  const n = Number(value) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(2).replace('.', ',')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(2).replace('.', ',')}K`;
  return String(n);
};

function Avatar({ src, name, className }) {
  return (
    <div className={`shrink-0 overflow-hidden rounded-full bg-[#0a1638] ${className}`}>
      {src
        ? <Image src={src} alt="" className="h-full w-full" fittingType="fill" />
        : <span className="flex h-full w-full items-center justify-center text-sm font-black text-white">{(name || '?')[0]}</span>}
    </div>
  );
}

/** Gönderilen referans görselin birebir karşılığı: üstte koyu kullanıcı bölümü, altta pembe panel. */
export default function ReferenceProfileCard({
  name, avatar, likes = 0, nLevel = 0, vipLevel = 0, giftSentLevel = 0, giftReceivedLevel = 0,
  memberId, age, gender, agency, slogan, roleLabel,
  actions = {}, followNode, self, onClose, onShare,
}) {
  const symbols = ['✦', '✧', '❖'];
  return (
    <div className="w-full overflow-hidden rounded-t-[26px] bg-gradient-to-b from-[#131a2b] via-[#0e1526] to-[#1a1020] shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2">
          <Avatar src={avatar} name={name} className="h-9 w-9 ring-2 ring-[#9fd8ff]/80" />
          <span className="min-w-0 truncate text-[15px] font-extrabold text-white">{name}</span>
          <span className="shrink-0 rounded-md bg-gradient-to-b from-[#f7dd93] to-[#b8862a] px-1.5 py-[1px] text-[10px] font-black text-[#2a1c00]">LV{nLevel}</span>
          <span className="shrink-0 rounded-md bg-gradient-to-b from-[#8ccbff] to-[#2b6fd8] px-1.5 py-[1px] text-[10px] font-black text-white">VIP{vipLevel}</span>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={onShare} aria-label="Paylaş" className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white/80 active:bg-white/20">
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onClose} aria-label="Kapat" className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white/80 active:bg-white/20">
              <Power className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-white/60">
          <span>ID:{memberId || '-'}</span>
          <span className="flex items-center gap-1"><Trophy className="h-3 w-3" />{fmt(likes)}</span>
          <span className="flex items-center gap-1">♪ Müzik</span>
        </div>
      </div>

      <div className="relative mt-3 flex flex-col items-center">
        <span className="pointer-events-none absolute left-1/2 top-1 h-20 w-[150px] -translate-x-[98%] rounded-[70%_30%_60%_40%/60%_70%_30%_40%] bg-gradient-to-l from-[#e8f6ff]/90 via-[#8fc4f5]/70 to-transparent blur-[1px]" />
        <span className="pointer-events-none absolute left-1/2 top-1 h-20 w-[150px] translate-x-[-2%] rounded-[30%_70%_40%_60%/70%_60%_40%_30%] bg-gradient-to-r from-[#e8f6ff]/90 via-[#8fc4f5]/70 to-transparent blur-[1px]" />
        <div className="relative rounded-full bg-gradient-to-b from-[#eaf7ff] via-[#a9d3f7] to-[#5c8fd0] p-[3px] shadow-[0_0_36px_rgba(140,200,255,0.7)]">
          <Avatar src={avatar} name={name} className="h-[88px] w-[88px]" />
        </div>
        <span className="relative -mt-2 rounded-md bg-gradient-to-b from-[#7fc4ff] to-[#2b6fd8] px-2 py-[1px] text-[10px] font-black text-white shadow-[0_0_12px_rgba(90,160,255,0.8)]">VIP{vipLevel}</span>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 rotate-45 bg-[#8fc4f5]" />
        <span className="font-serif text-[20px] tracking-wide text-white [text-shadow:0_0_12px_rgba(140,200,255,0.8)]">{name}</span>
        <span className="h-1.5 w-1.5 rotate-45 bg-[#8fc4f5]" />
      </div>

      {(age || agency) && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {age ? (
            <span className="rounded-md bg-gradient-to-b from-[#ff87b5] to-[#e8447f] px-2 py-[2px] text-[10px] font-bold text-white">
              {gender === 'erkek' ? '♂' : '♀'} {age}
            </span>
          ) : null}
          {agency ? (
            <span className="max-w-[45%] truncate rounded-md bg-gradient-to-b from-[#5b9af0] to-[#2456b8] px-2 py-[2px] text-[10px] font-bold text-white">{agency}</span>
          ) : null}
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-center gap-2 text-[11px] text-white/60">
        <span className="flex items-center gap-1">ID:{memberId || '-'}<Copy className="h-3 w-3" /></span>
        {agency ? <span className="truncate">🇹🇷 {agency}</span> : null}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <span className="rounded-md bg-gradient-to-b from-[#f7dd93] to-[#b8862a] px-2 py-[1px] text-[10px] font-black text-[#2a1c00]">VIP{vipLevel}</span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-[#ffd571]">🪙 {fmt(giftSentLevel)}</span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-[#ff8fb6]"><Heart className="h-3 w-3 fill-current" />{fmt(giftReceivedLevel)}</span>
      </div>

      <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
        <span className="shrink-0 text-[11px] font-bold text-white/75">Rozetler:</span>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((slot) => (
            <span key={slot} className="flex h-7 w-7 items-center justify-center rounded-md border border-[#8fc4f5]/60 bg-[#1c3a63] text-[8px] font-black text-[#cfe6ff] shadow-[0_0_10px_rgba(120,190,255,0.5)]">
              {slot === 0 ? (roleLabel || '').slice(0, 4) : slot === 1 ? symbols[0] : ''}
            </span>
          ))}
        </div>
        <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-white/40" />
      </div>

      <div className="relative mt-3 rounded-t-[26px] bg-gradient-to-b from-[#ffd0e2] via-[#ffc1d9] to-[#f7a0c4] px-4 pb-3 pt-4">
        <span className="absolute -left-1 -top-2 text-lg drop-shadow">🌹</span>
        <span className="absolute -right-1 -top-2 text-lg drop-shadow">🌹</span>

        <div className="flex items-start justify-between gap-2">
          <Avatar src={avatar} name={name} className="h-10 w-10 ring-2 ring-[#e0b06a]" />
          <div className="flex flex-1 flex-col items-center">
            <div className="relative">
              <span className="absolute left-1/2 top-1/2 h-6 w-12 -translate-x-[92%] -translate-y-1/2 rounded-[70%_30%_60%_40%/60%_60%_40%_40%] bg-gradient-to-l from-[#f6d68a] to-transparent" />
              <span className="absolute left-1/2 top-1/2 h-6 w-12 translate-x-[-8%] -translate-y-1/2 rounded-[30%_70%_40%_60%/60%_60%_40%_40%] bg-gradient-to-r from-[#f6d68a] to-transparent" />
              <Heart className="relative h-8 w-8 fill-[#f3c96b] text-[#a8781f] drop-shadow-[0_0_10px_rgba(243,201,107,0.9)]" />
            </div>
            <span className="mt-1 text-center text-[11px] font-semibold text-[#7a2b47]">{slogan || 'Aşk için bekliyor'}</span>
          </div>
          <span className="h-12 w-12 shrink-0 rounded-full border-2 border-[#e0b06a] bg-[#ffd9e7]/70" />
        </div>

        <div className={`mt-4 grid gap-2 ${self ? 'grid-cols-1 px-[26%]' : 'grid-cols-4'}`}>
          {!self && (
            <button type="button" onClick={actions.follow} className={TILE}>
              <span className={TILE_FRAME}>
                <UserPlus className="h-5 w-5" />
                {followNode && <span className="absolute inset-0 overflow-hidden opacity-0 [&>*]:h-full [&>*]:w-full">{followNode}</span>}
              </span>
              <span className={TILE_LABEL}>Takip Ediliyor</span>
            </button>
          )}
          {!self && (
            <button type="button" onClick={actions.chat} className={TILE}>
              <span className={TILE_FRAME}><MessageSquare className="h-5 w-5" /></span>
              <span className={TILE_LABEL}>Sohbet</span>
            </button>
          )}
          {!self && (
            <button type="button" onClick={actions.mention} className={TILE}>
              <span className={TILE_FRAME}><AtSign className="h-5 w-5" /></span>
              <span className={TILE_LABEL}>Bahsetme</span>
            </button>
          )}
          <button type="button" onClick={actions.gift} className={TILE}>
            <span className={TILE_FRAME}><Gift className="h-5 w-5" /></span>
            <span className={TILE_LABEL}>Hediye</span>
          </button>
        </div>
      </div>
    </div>
  );
}