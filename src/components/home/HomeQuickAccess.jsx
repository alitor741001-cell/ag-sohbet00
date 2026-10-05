import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, Mic, Users } from 'lucide-react';

const TILES = [
  { key: 'chats', label: 'Özel Sohbet', path: '/arkadaslar?view=chats', icon: MessageCircle },
  { key: 'friends', label: 'Arkadaşlar', path: '/arkadaslar', icon: Users },
  { key: 'alerts', label: 'Bildirimler', path: '/bildirimler', icon: Bell },
];

/** Hızlı erişim: belirgin oda kurma çağrısı ve günlük kısayollar. */
export default function HomeQuickAccess() {
  const navigate = useNavigate();

  return (
    <section className="mb-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3 w-1 rounded-full bg-gradient-to-b from-premium-gold to-premium-red" />
        <h2 className="text-[10.5px] font-black tracking-[0.18em] text-premium-gold">HIZLI ERİŞİM</h2>
      </div>

      <button
        type="button"
        onClick={() => navigate('/oda-kur')}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-premium-gold/60 bg-gradient-to-r from-premium-red-deep via-premium-red to-premium-gold py-2.5 text-[13px] font-black text-white shadow-[0_0_22px_-6px_rgba(212,175,55,0.8)] transition-transform active:scale-[0.98]"
      >
        <Mic className="h-4 w-4" /> ODA KUR
      </button>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {TILES.map(({ key, label, path, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => navigate(path)}
            className="premium-panel flex flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 transition-transform active:scale-[0.97]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-premium-gold/35 bg-premium-red/15">
              <Icon className="h-4 w-4 text-premium-gold" />
            </span>
            <span className="text-[10px] font-bold text-white/85">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}