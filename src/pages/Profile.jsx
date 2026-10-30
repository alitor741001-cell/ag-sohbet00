import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Image } from '@/components/ui/image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { giftBoxLocked } from '@/lib/giftAccess';
import Zone from '@/components/profile/design/Zone';
import useProfileDesignData from '@/components/profile/design/useProfileDesignData';
import GiftBoxPanel from '@/components/profile/GiftBoxPanel';
import GiftSendersPanel from '@/components/profile/GiftSendersPanel';
import VipBagPanel from '@/components/profile/VipBagPanel';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import SocialListDialog from '@/components/profile/social/SocialListDialog';
import BlockedUsers from '@/components/profile/BlockedUsers';
import PrivacyPolicyBody from '@/components/profile/PrivacyPolicyBody';
import ProfileSettings from '@/components/profile/ProfileSettings';

const DESIGN = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a360d8cea_IMG_0483.jpg';
const fmt = (n) => Number(n || 0).toLocaleString('tr-TR');
const Val = ({ children, color = '#fff' }) => <span className="truncate text-[min(3.6vw,15px)] font-extrabold" style={{ color, textShadow: '0 1px 3px #000' }}>{children}</span>;

export default function Profile() {
  const { user, reload } = useCurrentUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wallet, profile, vipCount, counts } = useProfileDesignData(user);
  const [panel, setPanel] = useState(null);
  const [list, setList] = useState(null);
  const [sheet, setSheet] = useState(null);
  if (!user) return null;

  const p = profile || user;
  const name = user.username || user.full_name || 'Profilim';
  const isOwner = p.agency_role === 'owner' || !!p.owned_agency_id;
  const isCaster = p.broadcaster_status === 'active' || !!p.agency_record_id;
  const locked = giftBoxLocked(user);
  const social = [['friends', 'Arkadaşlar', () => navigate('/arkadaslar')], ['following', 'Takip Edilenler'], ['followers', 'Takipçiler'], ['visitors', 'Ziyaretçiler']];
  const sheets = { blocked: ['Engellenen Hesaplar', <BlockedUsers key="b" />], privacy: ['Gizlilik Politikası', <PrivacyPolicyBody key="p" />], settings: ['Ayarlar', <ProfileSettings key="s" user={user} onUpdated={reload} />] };

  return (
    <div className="design-screen z-0 overflow-hidden touch-none bg-[#02030c]" style={{ height: 'calc(var(--design-height) - 4rem - env(safe-area-inset-bottom))' }}>
      <div className="relative mx-auto h-full" style={{ aspectRatio: '682 / 1024', maxWidth: '100%' }}>
        <img src={DESIGN} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none object-fill" />
        <Zone x={98} y={112} w={120} h={120} className="overflow-hidden rounded-full">
          {user.avatar ? <Image src={user.avatar} className="h-full w-full rounded-full" fittingType="fill" /> : <span className="text-3xl font-bold text-white">{name[0]?.toUpperCase()}</span>}
        </Zone>
        <Zone x={290} y={200} w={78} h={32}><Val>{p.member_id || '-'}</Val></Zone>
        <Zone x={420} y={200} w={68} h={32}><Val>Lv {p.n_level || 0}</Val></Zone>
        <Zone x={536} y={200} w={82} h={32}><Val>{p.gift_received_level || 0}</Val></Zone>
        <Zone x={300} y={246} w={170} h={34}><Val color="#ffe08a">{name}</Val></Zone>
        <Zone x={58} y={300} w={237} h={50} className={isOwner ? '' : 'bg-black/45 rounded-full'} />
        <Zone x={316} y={300} w={164} h={50} className={isCaster ? '' : 'bg-black/45 rounded-full'} />
        <Zone x={130} y={372} w={490} h={52} className="justify-start"><Val>{user.title || user.slogan || (p.vip_level ? `VIP${p.vip_level}` : 'AG SOHBET')}</Val></Zone>
        {social.map(([key, label, go], i) => (
          <Zone key={key} x={48 + i * 148} y={466} w={146} h={104} label={label} onClick={go || (() => setList(key))} className="items-end pb-0">
            <span className="mb-[-2%] text-[min(3vw,12px)] font-bold text-white/90">{fmt(counts[key])}</span>
          </Zone>
        ))}
        <Zone x={170} y={640} w={155} h={50} label="Coins" onClick={() => setPanel('coins')}><Val color="#ffd36b">{wallet ? fmt(wallet.coins) : '…'}</Val></Zone>
        <Zone x={470} y={640} w={160} h={50} label="Elmaslar" onClick={() => locked ? toast({ title: 'Elmas bölümü yayıncılara açıktır', variant: 'destructive' }) : setPanel('gift')}><Val color="#7fe3ff">{locked ? '🔒' : wallet ? fmt(wallet.month_score) : '…'}</Val></Zone>
        <Zone x={170} y={770} w={155} h={50} label="Vip" onClick={() => setPanel('vip')}><Val color="#ffd36b">{p.vip_level ? `VIP${p.vip_level}` : `${vipCount} çanta`}</Val></Zone>
        <Zone x={470} y={790} w={160} h={36} label="Hediye Geçmişi" onClick={() => setPanel('senders')} />
        <Zone x={40} y={590} w={130} h={115} label="Coins" onClick={() => setPanel('coins')} />
        <Zone x={160} y={872} w={140} h={100} label="Engellenen Hesaplar" onClick={() => setSheet('blocked')} />
        <Zone x={300} y={872} w={110} h={100} label="Gizlilik Politikası" onClick={() => setSheet('privacy')} />
        <Zone x={420} y={872} w={130} h={100} label="Ayarlar" onClick={() => setSheet('settings')} />
      </div>

      <GiftBoxPanel open={panel === 'gift'} onClose={() => setPanel(null)} />
      <GiftSendersPanel open={panel === 'senders'} onClose={() => setPanel(null)} />
      <VipBagPanel open={panel === 'vip'} onClose={() => setPanel(null)} />
      <CoinPurchasePanel open={panel === 'coins'} coins={wallet?.coins} onBack={() => setPanel(null)} />
      <SocialListDialog open={!!list} kind={list} onClose={() => setList(null)} />
      <Dialog open={!!sheet} onOpenChange={(o) => !o && setSheet(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-[#0a0a14] text-white">
          <DialogTitle>{sheets[sheet]?.[0]}</DialogTitle>
          {sheets[sheet]?.[1]}
        </DialogContent>
      </Dialog>
    </div>
  );
}