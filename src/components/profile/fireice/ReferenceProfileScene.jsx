import { Bell, Briefcase, Building2, Crown, ShoppingBag, Store, TrendingUp, Users } from 'lucide-react';
import { Image } from '@/components/ui/image';
import ReferenceIdentity from '@/components/profile/fireice/ReferenceIdentity';
import ReferenceWallet from '@/components/profile/fireice/ReferenceWallet';
import '@/components/profile/fireice/referenceProfile.css';

const TILES = [
  ['shop', 'Alışveriş Merkezi', ShoppingBag], ['store', 'Mağaza', Store],
  ['bag', 'VIP Çantası', Briefcase], ['level', 'Seviye', TrendingUp],
  ['vip', 'VIP', Crown], ['agency', 'Ajans', Building2],
  ['friends', 'Arkadaşlar', Users], ['notifications', 'Bildirimler', Bell],
];
export default function ReferenceProfileScene({ identity, wallet, vipCount, onSelect, onInfo, onSettings, onActivity, onBlocked, onPrivacy }) {
  return <div className="reference-profile">
    <Image src="https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1eba69c82_IMG_0482.jpg" alt="" aria-hidden="true" className="reference-art" fittingType="fit" loading="eager" blurPlaceholder={false} />
    <ReferenceIdentity {...identity} />
    <button type="button" className="reference-zone reference-info" onClick={onInfo}><span>Kişisel Bilgiler</span></button>
    <button type="button" className="reference-zone reference-settings" onClick={onSettings}><span>Ses ve Mikrofon</span></button>
    <button type="button" className="reference-zone reference-activity" onClick={onActivity}><span>Hesap Hareketleri</span></button>
    <ReferenceWallet {...wallet} />
    {TILES.map(([key, label, Icon], index) => <button type="button" key={key} onClick={() => onSelect(key)} className="reference-zone reference-tile" style={{ left: index % 2 ? '53%' : '6%', top: `${49 + Math.floor(index / 2) * 10}%` }}>
      <span><Icon /><span>{label}{key === 'bag' && vipCount > 0 ? ` (${vipCount})` : ''}</span></span>
    </button>)}
    <button type="button" onClick={onBlocked} aria-label="Engellenen hesaplar" className="reference-zone reference-footer" style={{ left: '20%' }} />
    <button type="button" onClick={onPrivacy} aria-label="Gizlilik ve güvenlik" className="reference-zone reference-footer" style={{ left: '41.5%' }} />
    <button type="button" onClick={onSettings} aria-label="Ayarlar" className="reference-zone reference-footer" style={{ left: '63%' }} />
  </div>;
}