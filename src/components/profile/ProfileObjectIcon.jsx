import { Image } from '@/components/ui/image';
import useProfileIconPng from '@/hooks/useProfileIconPng';

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
  bag: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/794fc8e2c_generated_5e65fe31.png',
  level: '6b6acb18d_profile-level.png',
  agency: '261cedf45_profile-agency.png',
  admin: 'a09a8db87_profile-admin.png',
  blocked: '7a2a6fda4_profile-blocked.png',
  privacy: '92dbfc0f6_profile-privacy.png',
  settings: 'dc5eb8926_profile-settings.png',
};

export default function ProfileObjectIcon({ kind, Icon }) {
  const original = ART[kind];
  const source = original ? (original.startsWith('https://') ? original : `${BASE}/${original}`) : '';
  const transparent = useProfileIconPng(source);
  return (
    <span className="relative flex h-[46px] w-[58px] shrink-0 items-center justify-center" aria-hidden="true">
      {transparent ? <Image src={transparent} alt="" fittingType="fit"
        className="h-full w-full" blurPlaceholder={false} />
        : <Icon className="h-8 w-8 text-premium-gold-light" />}
    </span>
  );
}