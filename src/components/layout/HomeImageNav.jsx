import LiveChatButton from '@/components/layout/LiveChatButton';
import UserSupportButton from '@/components/layout/UserSupportButton';

export const HOME_DESIGN = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a5c5853e0_IMG_0141.jpg';

const ZONES = [
  { label: 'Ana Sayfa', path: '/', left: 0, width: 22 },
  { label: 'Sohbet', path: '/arkadaslar?view=chats', activePath: '/arkadaslar', left: 22, width: 17.5 },
  { label: 'Oyunlar', path: '/?oyunlar=1', left: 39.5, width: 21 },
  { label: 'Profil', path: '/profil', left: 79.5, width: 20.5 },
];

/** Ana sayfa alt menüsü: gönderilen tasarımın alt şeridi birebir, üstünde görünmez dokunma alanları. */
export default function HomeImageNav({ onNav, isAdmin, supportBadge }) {
  return (
    <nav aria-label="Ana menü" className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]" style={{ background: '#030914' }}>
      <div className="relative mx-auto w-full max-w-[36rem]" style={{ aspectRatio: '682 / 200', backgroundImage: `url(${HOME_DESIGN})`, backgroundSize: '100% auto', backgroundPosition: 'center bottom' }}>
        {ZONES.map((z) => (
          <button key={z.label} type="button" aria-label={z.label} onClick={() => onNav(z)}
            className="absolute top-[10%] bottom-0" style={{ left: `${z.left}%`, width: `${z.width}%` }} />
        ))}
        <div className="absolute top-[10%] bottom-0 flex items-center justify-center opacity-0 [&>*]:h-full [&>*]:w-full" style={{ left: '60.5%', width: '19%' }}>
          {isAdmin ? <LiveChatButton placement="dock" /> : <UserSupportButton badge={supportBadge} />}
        </div>
      </div>
    </nav>
  );
}