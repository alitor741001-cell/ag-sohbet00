import { AtSign, Gift, Lock, MessageSquare, Mic, MicOff, Unlock, User, UserCheck, UserPlus, CalendarDays } from 'lucide-react';
import { Image } from '@/components/ui/image';

const BG = {
  blue: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6b9a14203_generated_image.png',
  pink: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1bb649a33_generated_image.png',
};

const at = (x, y) => ({ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' });

/** Sesli oda profil kartı: referans görselin birebir düzeni; veriler görselin boş alanlarına yerleşir. */
export default function VoiceImageCard({
  tone, name, avatar, genderSymbol, roleLabel, receivedLevel, nLevel, vipLevel, joinDate,
  micMuted, seatLocked, isSelf, following, onMic, onLock, onStand, onFollow, onChat, onMention, onGift,
}) {
  const glow = tone === 'pink' ? '#ff6fb5' : '#4fa8ff';
  const text = { textShadow: `0 0 8px ${glow}, 0 1px 2px #000` };
  const rect = [
    { key: 'mic', icon: micMuted ? MicOff : Mic, label: micMuted ? 'Mik aç' : 'Mik kapat', onClick: onMic, x: 24.5 },
    { key: 'lock', icon: seatLocked ? Unlock : Lock, label: seatLocked ? 'Kilidi aç' : 'Koltuğu kilitle', onClick: onLock, x: 50 },
    { key: 'stand', icon: User, label: 'Ayağa kalk', onClick: onStand, x: 75.5 },
  ];
  const circles = [
    !isSelf && { key: 'follow', icon: following ? UserCheck : UserPlus, label: following ? 'Takip Ediliyor' : 'Takip Et', onClick: onFollow, x: 17.5 },
    !isSelf && { key: 'chat', icon: MessageSquare, label: 'Sohbet', onClick: onChat, x: 39.5 },
    { key: 'mention', icon: AtSign, label: 'Bahset', onClick: onMention, x: 60.5 },
    { key: 'gift', icon: Gift, label: 'Hediye', onClick: onGift, x: 82 },
  ].filter(Boolean);

  return (
    <div className="relative w-full select-none text-white" style={{ aspectRatio: '682 / 1024' }}>
      <Image src={BG[tone]} alt="" fittingType="fill" className="absolute inset-0 h-full w-full" draggable={false} />

      <div className="absolute overflow-hidden rounded-full" style={{ ...at(50, 13.2), width: '27%', aspectRatio: '1' }}>
        {avatar
          ? <Image src={avatar} alt={name} fittingType="fill" className="h-full w-full" />
          : <span className="flex h-full w-full items-center justify-center bg-black/60 text-3xl font-black">{(name || '?')[0]}</span>}
      </div>
      <span className="absolute text-[6vw] font-black leading-none sm:text-2xl" style={{ ...at(60.5, 21.5), color: glow, ...text }}>{genderSymbol}</span>
      {vipLevel > 0 && <span className="absolute text-[10px] font-black" style={{ ...at(50, 25.3), ...text }}>VIP</span>}

      <span className="absolute whitespace-nowrap text-[9px] font-extrabold uppercase tracking-wide" style={{ left: '7%', top: '32.4%', transform: 'translateY(-50%)', color: '#f4dda4' }}>
        👑 💛 Her zaman daha güçlü
      </span>
      <span className="absolute text-base" style={{ ...at(87, 34), color: '#f4dda4', fontFamily: "'Great Vibes', cursive" }}>Sen Özelsin</span>

      <span className="absolute max-w-[46%] truncate text-center font-black uppercase" style={{ ...at(50, 39), fontSize: 'min(7vw, 30px)', fontFamily: 'Georgia, serif', ...text }}>
        {roleLabel || name}
      </span>

      <span className="absolute flex items-center gap-1 text-sm font-black" style={at(26, 48.5)}>🤍 {receivedLevel}</span>
      <span className="absolute flex items-center gap-1 text-sm font-black" style={at(50, 48.5)}>🛡️ N{nLevel}</span>
      <span className="absolute flex items-center gap-1 text-sm font-black" style={at(73.5, 48.5)}>💎 VIP{vipLevel}</span>

      <span className="absolute flex items-center gap-2 text-[11px] font-bold" style={{ left: '19%', top: '57.5%', transform: 'translateY(-50%)' }}>
        <CalendarDays className="h-4 w-4" /> Kayıt Tarihi
      </span>
      <span className="absolute text-sm font-black" style={{ right: '17%', top: '57.5%', transform: 'translateY(-50%)' }}>{joinDate}</span>

      {rect.map((item) => (
        <button key={item.key} type="button" onClick={item.onClick} className="absolute flex flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold active:scale-95" style={{ ...at(item.x, 66.8), width: '23%', height: '7.5%' }}>
          <item.icon className="h-5 w-5" style={{ color: glow }} /> {item.label}
        </button>
      ))}

      {circles.map((item) => (
        <button key={item.key} type="button" onClick={item.onClick} className="absolute flex flex-col items-center active:scale-95" style={{ ...at(item.x, 88.5), width: '18%' }}>
          <span className="flex aspect-square w-[70%] items-center justify-center rounded-full"><item.icon className="h-6 w-6" /></span>
          <span className="mt-1 whitespace-nowrap text-[10px] font-bold" style={text}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}