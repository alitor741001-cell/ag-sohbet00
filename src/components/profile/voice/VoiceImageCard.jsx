import { Image } from '@/components/ui/image';

const BG = {
  blue: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6b9a14203_generated_image.png',
  pink: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1bb649a33_generated_image.png',
};

const at = (x, y) => ({ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' });
// Düğmeler kartın genişliğine eşit dağılır: 1, 2, 3 veya 4 düğme aynı hizada ortalanır.
const spread = (count, index) => ((index + 1) * 100) / (count + 1);

/** Sesli oda ve uygulama geneli profil kartı: referans görselin düzeni, üzerine yerleşen gerçek düğmeler. */
export default function VoiceImageCard({
  tone = 'pink', name, avatar, genderSymbol, roleLabel, receivedLevel, nLevel, vipLevel, joinDate,
  rectItems = [], circleItems = [],
}) {
  const glow = tone === 'pink' ? '#ff6fb5' : '#4fa8ff';
  const text = { textShadow: `0 0 8px ${glow}, 0 1px 2px #000` };
  const tap = { border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.22)', boxShadow: `0 0 12px -4px ${glow}` };

  return (
    <div className="relative h-full w-full select-none overflow-hidden rounded-t-[22px] text-white" style={{ aspectRatio: '682 / 1024' }}>
      <Image src={BG[tone]} alt="" fittingType="fill" className="absolute inset-0 h-full w-full" draggable={false} />

      <div className="absolute overflow-hidden rounded-full" style={{ ...at(50, 13.2), width: '27%', aspectRatio: '1' }}>
        {avatar
          ? <Image src={avatar} alt={name} fittingType="fill" className="h-full w-full" />
          : <span className="flex h-full w-full items-center justify-center bg-black/60 text-2xl font-black">{(name || '?')[0]}</span>}
      </div>
      {genderSymbol && (
        <span className="absolute text-xl font-black leading-none" style={{ ...at(60.5, 21.5), color: glow, ...text }}>{genderSymbol}</span>
      )}
      {vipLevel > 0 && <span className="absolute text-[10px] font-black" style={{ ...at(50, 25.3), ...text }}>VIP</span>}

      <span className="absolute whitespace-nowrap text-[8px] font-extrabold uppercase tracking-wide" style={{ left: '7%', top: '32.4%', transform: 'translateY(-50%)', color: '#f4dda4' }}>
        👑 💛 Her zaman daha güçlü
      </span>
      <span className="absolute text-sm" style={{ ...at(87, 34), color: '#f4dda4', fontFamily: "'Great Vibes', cursive" }}>Sen Özelsin</span>

      {roleLabel && (
        <span className="absolute max-w-[60%] truncate rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide" style={{ ...at(50, 35.2), color: '#f4dda4', border: '1px solid rgba(244,221,164,0.5)', background: 'rgba(0,0,0,0.35)' }}>
          {roleLabel}
        </span>
      )}
      <span className="absolute max-w-[52%] truncate text-center font-black uppercase" style={{ ...at(50, 39.5), fontSize: '18px', fontFamily: 'Georgia, serif', ...text }}>
        {name}
      </span>

      <span className="absolute text-xs font-black" style={at(26, 48.5)}>🤍 {receivedLevel}</span>
      <span className="absolute text-xs font-black" style={at(50, 48.5)}>🛡️ N{nLevel}</span>
      <span className="absolute text-xs font-black" style={at(73.5, 48.5)}>💎 VIP{vipLevel}</span>

      <span className="absolute text-[10px] font-bold" style={{ left: '19%', top: '57.5%', transform: 'translateY(-50%)' }}>📅 Kayıt Tarihi</span>
      <span className="absolute text-xs font-black" style={{ right: '17%', top: '57.5%', transform: 'translateY(-50%)' }}>{joinDate}</span>

      {rectItems.map((item, index) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onClick}
          className="absolute flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold active:scale-95"
          style={{ ...at(spread(rectItems.length, index), 66.8), width: '23%', height: '8%', ...tap }}
        >
          <item.icon className="h-4 w-4" style={{ color: glow }} />
          <span className="max-w-full truncate leading-tight">{item.label}</span>
        </button>
      ))}

      {circleItems.map((item, index) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onClick}
          className="absolute flex min-w-0 flex-col items-center active:scale-95"
          style={{ ...at(spread(circleItems.length, index), 85), width: '20%' }}
        >
          <span className="flex aspect-square w-[74%] items-center justify-center rounded-full" style={tap}>
            <item.icon className="h-5 w-5" style={{ color: glow }} />
          </span>
          <span className="mt-1 max-w-full truncate text-[10px] font-bold" style={text}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}