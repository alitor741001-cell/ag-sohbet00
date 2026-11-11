import { Image } from '@/components/ui/image';

const BASE = 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62';
const ART = {
  friends: '5ecc6805d_profile-friends.png',
  following: '0714fdc03_profile-following.png',
  followers: '29e877214_profile-followers.png',
  visitors: '1530f7f11_profile-visitors.png',
  coins: '01db6705b_profile-coins.png',
  diamonds: '97700644c_profile-diamonds.png',
  vip: '5cc3c6f93_profile-vip.png',
  giftHistory: '27cab5553_profile-giftHistory.png',
  bag: '071ea84e2_profile-bag.png',
  level: '6b6acb18d_profile-level.png',
  agency: '261cedf45_profile-agency.png',
  admin: 'a09a8db87_profile-admin.png',
  blocked: '7a2a6fda4_profile-blocked.png',
  privacy: '92dbfc0f6_profile-privacy.png',
  settings: 'dc5eb8926_profile-settings.png',
};

export default function ProfileObjectIcon({ kind, Icon }) {
  return ART[kind] ? (
    <Image src={`${BASE}/${ART[kind]}`} alt="" aria-hidden="true" fittingType="fit"
      className="relative h-[34px] w-[40px] shrink-0" blurPlaceholder={false} />
  ) : <Icon aria-hidden="true" className="relative h-6 w-6 shrink-0 text-premium-gold-light" />;
}