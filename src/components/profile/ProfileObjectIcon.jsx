import useProfileIconPng from '@/hooks/useProfileIconPng';

const BASE = 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62';
const ART = {
  friends: 'b04d2b4c8_profile-friends-transparent.png',
  following: '26da6315c_profile-following-transparent.png',
  followers: 'e2dd97a68_profile-followers-transparent.png',
  visitors: 'ae4a68d22_profile-visitors-transparent.png',
  coins: 'a8f766a19_profile-coins-transparent.png',
  diamonds: '5229849a2_profile-diamonds-transparent.png',
  vip: 'c5c9872f1_profile-vip-transparent.png',
  giftHistory: '235682cea_profile-giftHistory-transparent.png',
  bag: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/794fc8e2c_generated_5e65fe31.png',
  level: '1076423d1_profile-level-transparent.png',
  agency: '9fb9dc552_profile-agency-transparent.png',
  admin: '4938f7ada_profile-admin-transparent.png',
  blocked: '391dae8dc_profile-blocked-transparent.png',
  privacy: '57c5670e1_profile-privacy-transparent.png',
  settings: '328b8d808_profile-settings-transparent.png',
};

export default function ProfileObjectIcon({ kind, Icon }) {
  const original = ART[kind];
  const source = original ? (original.startsWith('https://') ? original : `${BASE}/${original}`) : '';
  // Tüm ikonlar çanta ikonu gibi işlenir: kenara bağlı beyaz kare zemin temizlenir.
  const transparent = useProfileIconPng(source);
  return (
    <span className="relative flex h-[46px] w-[58px] shrink-0 items-center justify-center overflow-hidden" aria-hidden="true">
      {/* Görsellerin kenarındaki ince beyaz kare çerçeve, büyütülüp kırpılarak dışarıda bırakılır. */}
      {transparent ? <img src={transparent} alt="" className="h-full w-full scale-[1.35] object-contain" />
        : <Icon className="h-8 w-8 text-premium-gold-light" />}
    </span>
  );
}