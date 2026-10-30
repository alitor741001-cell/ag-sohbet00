import { BadgeCheck, Copy, Crown, Heart, Shield, Star } from 'lucide-react';
import XpAvatar from '@/components/xp/XpAvatar';
import { badgesFromUser, vipDaysLeft, vipLevelOf } from '@/lib/userLevels';
import { broadcasterState } from '@/lib/broadcaster';

const ART = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/619952545_generated_image.png';
const money = (v) => (v == null ? '—' : Number(v).toLocaleString('tr-TR', { maximumFractionDigits: 2 }));
// Ölçüler 682×1024 tasarım görseline göre yüzdedir; yazılar genişlikle ölçeklenir (cqw).
const at = (left, top, extra = {}) => ({ position: 'absolute', left: `${left}%`, top: `${top}%`, ...extra });
const Zone = ({ l, t, w, h, onClick, label }) => (
  <button type="button" aria-label={label} onClick={onClick} className="absolute rounded-xl active:bg-white/10" style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` }} />
);
const PILL = 'absolute flex items-center justify-center gap-[0.8cqw] rounded-full font-black text-white';

/** Profil: gönderilen tasarım görseli zemin, gerçek veriler aynı yerlerde. */
export default function NeonDesignProfile({ user, avatar, stats = {}, wallet = {}, vipCount = 0, onCopyId, onAvatar, on = {} }) {
  const name = user.username || user.full_name || 'Kullanıcı';
  const b = badgesFromUser(user);
  const vip = vipLevelOf(user);
  const days = vipDaysLeft(user);
  const owner = !!user.owned_agency_id || user.agency_role === 'owner';
  const agencyName = owner ? user.owned_agency_name || user.agency_name : user.agency_name;
  const agencyCode = owner ? user.owned_agency_code || user.agency_code : user.agency_code;
  const columns = [[18.8, stats.friends, 'Arkadaşlar', on.friends], [39.3, stats.following, 'Takip Edilenler', on.following], [60.4, stats.followers, 'Takipçiler', on.followers], [81.1, stats.visitors, 'Ziyaretçiler', on.visitors]];
  const menu = [[18.8, 'Alışveriş\nMerkezi', on.shop], [39.3, 'Çanta', on.bag], [60.1, 'Seviye', on.level], [81.1, 'Ajans', on.agency]];
  const footer = [[32.7, 'Engellenen\nHesaplar', on.blocked], [50, 'Gizlilik\nPolitikası', on.privacy], [67.7, 'Ayarlar', on.settings]];

  return (
    <div className="relative mx-auto w-full max-w-[560px] select-none overflow-hidden text-white" style={{ aspectRatio: '682 / 1024', containerType: 'inline-size', backgroundImage: `url(${ART})`, backgroundSize: '100% 100%' }}>
      {/* Avatar çemberin tam ortasında */}
      <div className="absolute overflow-hidden rounded-full" style={{ left: '12.8%', top: '8.2%', width: '16.4%', aspectRatio: '1', transform: 'translate(0, 0)' }}>
        <XpAvatar avatar={avatar || user.avatar} name={name} size="xl" className="!h-full !w-full" />
        {onAvatar && <label className="absolute inset-0 cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={onAvatar} /></label>}
      </div>
      {vip > 0 && <span className="absolute -translate-x-1/2 font-black text-[#ffe9a8]" style={{ ...at(21, 20.6), fontSize: '3.6cqw', textShadow: '0 0 6px #b06a00' }}>VIP{vip}</span>}

      <div className="absolute flex items-center gap-[1cqw]" style={{ ...at(41.5, 8.1), width: '30%' }}>
        <span className="truncate font-black uppercase text-[#ffc93c]" style={{ fontSize: '5.4cqw', textShadow: '0 0 8px rgba(255,140,0,.7)' }}>{name}</span>
        {user.role === 'admin' && <BadgeCheck className="shrink-0 text-[#38bdf8]" style={{ width: '4.5cqw', height: '4.5cqw' }} />}
        <span style={{ fontSize: '4cqw' }}>🇹🇷</span>
      </div>
      <button type="button" onClick={onCopyId} className="absolute flex items-center gap-[1cqw] font-bold" style={{ ...at(37.8, 11.6), fontSize: '3.4cqw' }}>
        ID:{user.member_id || '—'} <Copy style={{ width: '3.2cqw', height: '3.2cqw' }} />
      </button>

      <div className="absolute flex gap-[1.5cqw]" style={{ ...at(37, 14.6), fontSize: '3.3cqw' }}>
        <span className="flex items-center gap-[0.8cqw] rounded-full border border-[#2dd4bf]/70 bg-[#0b3b36] px-[2.6cqw] py-[0.6cqw] font-black"><Shield style={{ width: '3cqw' }} />N{b.n_level}</span>
        <span className="flex items-center gap-[0.8cqw] rounded-full bg-gradient-to-b from-[#ffb347] to-[#e8780c] px-[2.6cqw] py-[0.6cqw] font-black"><Star fill="currentColor" style={{ width: '3cqw' }} />Atış {b.gift_sent_level}</span>
        <span className="flex items-center gap-[0.8cqw] rounded-full bg-gradient-to-b from-[#4aa8ff] to-[#1d5fd6] px-[2.6cqw] py-[0.6cqw] font-black"><Heart fill="currentColor" style={{ width: '3cqw' }} />Alış {b.gift_received_level}</span>
      </div>
      {vip > 0 && (
        <span className={PILL} style={{ ...at(37, 19), width: '29%', height: '3.6%', fontSize: '3.4cqw', border: '1px solid #e8b04a', background: '#1a1206' }}>
          <Crown className="text-[#ffc93c]" fill="currentColor" style={{ width: '3.4cqw' }} /><span className="text-[#ffe9a8]">VIP{vip} · {days ? `${days} gün` : 'süresiz'}</span>
        </span>
      )}
      {owner && <span className={PILL} style={{ ...at(8.5, 24.5), width: '29.5%', height: '3.9%', fontSize: '3cqw', border: '1.5px solid #ff4d2e', background: 'rgba(40,6,6,.85)', color: '#ffd1c2' }}>👤 AJANS SAHİBİ</span>}
      {broadcasterState(user).active && <span className={PILL} style={{ ...at(40.6, 24.5), width: '20%', height: '3.9%', fontSize: '3cqw', border: '1.5px solid #ff4d2e', background: 'rgba(40,6,6,.85)', color: '#ffd1c2' }}>🎙 YAYINCI</span>}

      <p className="absolute font-black" style={{ ...at(23.8, 30.6), fontSize: '3.5cqw' }}>Ajans: <span className="text-[#ffc93c]">{agencyName || '—'}</span></p>
      <p className="absolute font-bold text-[#ff8a7a]" style={{ ...at(23.8, 33.6), fontSize: '3.3cqw' }}>Ajans Kimliği: {agencyCode || '—'}</p>

      {columns.map(([x, value, label, run]) => (
        <div key={label}>
          <span className="absolute -translate-x-1/2 whitespace-nowrap font-bold" style={{ ...at(x, 42.3), fontSize: '3cqw' }}>{label}</span>
          <span className="absolute -translate-x-1/2 font-black" style={{ ...at(x, 44.8), fontSize: '5cqw' }}>{value ?? 0}</span>
          <Zone l={x - 10} t={38.5} w={20} h={9.5} label={label} onClick={run} />
        </div>
      ))}

      <span className="absolute font-black text-[#ffc93c]" style={{ ...at(26, 51.3), fontSize: '3.6cqw' }}>Coins</span>
      <span className="absolute font-black" style={{ ...at(26, 53.4), fontSize: '6.6cqw' }}>{money(wallet.coins)}</span>
      <span className="absolute font-bold" style={{ ...at(26, 57), fontSize: '3.4cqw' }}>{money(wallet.score)}</span>
      <span className="absolute font-black text-[#5ec8ff]" style={{ ...at(66.5, 51.3), fontSize: '3.6cqw' }}>Elmaslar</span>
      <span className="absolute font-black" style={{ ...at(66.5, 53.4), fontSize: '6.6cqw' }}>{money(wallet.diamonds)}</span>
      <span className="absolute font-bold" style={{ ...at(66.5, 57), fontSize: '3.4cqw' }}>{money(wallet.diamondScore)}</span>
      <Zone l={8} t={49.5} w={41} h={10.5} label="Coins" onClick={on.coins} />
      <Zone l={51} t={49.5} w={41} h={10.5} label="Elmaslar" onClick={on.diamonds} />

      <span className="absolute font-black" style={{ ...at(25, 62.8), fontSize: '4.2cqw' }}>Vip</span>
      <span className="absolute font-black" style={{ ...at(25, 65.6), fontSize: '4.8cqw' }}>{vipCount} VIP</span>
      <span className="absolute font-black leading-tight" style={{ ...at(66, 62.6), fontSize: '4cqw' }}>Hediye<br />Geçmişi</span>
      <span className="absolute font-bold" style={{ ...at(66, 67.4), fontSize: '3.2cqw' }}>Geçmişi gör...</span>
      <Zone l={8} t={61.5} w={41} h={9} label="Vip" onClick={on.vip} />
      <Zone l={51} t={61.5} w={41} h={9} label="Hediye Geçmişi" onClick={on.history} />

      {menu.map(([x, label, run]) => (
        <div key={label}>
          <span className="absolute -translate-x-1/2 whitespace-pre text-center font-bold leading-tight" style={{ ...at(x, 79.6), fontSize: '3.2cqw' }}>{label}</span>
          <Zone l={x - 10} t={72.5} w={20} h={12.5} label={label.replace('\n', ' ')} onClick={run} />
        </div>
      ))}
      {footer.map(([x, label, run]) => (
        <div key={label}>
          <span className="absolute -translate-x-1/2 whitespace-pre text-center font-bold leading-tight" style={{ ...at(x, 95.6), fontSize: '2.8cqw' }}>{label}</span>
          <Zone l={x - 8} t={90.5} w={16} h={9} label={label.replace('\n', ' ')} onClick={run} />
        </div>
      ))}
    </div>
  );
}