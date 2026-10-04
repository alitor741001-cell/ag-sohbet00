import { vipActive, vipLevelOf } from '@/lib/userLevels';

/** Gizli kullanıcının odalarda görünen takma adı — isim, kimlik ve profil taşımaz. */
export const HIDDEN_DISPLAY_NAME = 'Gizli Kullanıcı';

/** Gizli kullanıcının siyah-altın maskeli profil görseli: gerçek fotoğraf yerine bu görünür. */
export const HIDDEN_AVATAR_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/df5f81e7b_IMG_1373.jpeg';

/** Gizli modun gerektirdiği en düşük VIP seviyesi. */
export const HIDDEN_REQUIRED_VIP = 10;

/** Takma ad her zaman 8 haneli numarayla biter, gerçek kimliği belli etmez. */
export const isHiddenName = (name) => typeof name === 'string' && name.startsWith(HIDDEN_DISPLAY_NAME);

/** Kişiye özel 8 haneli takma numara — backend ile aynı, kullanıcıya her yerde aynı görünür. */
export const hiddenUserCode = (user) => {
  const seed = String(user?.id || 'gizli');
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 37 + seed.charCodeAt(i)) % 90000000;
  return String(10000000 + Math.abs(hash));
};

/** Odalarda görünen tam takma ad. */
export const hiddenDisplayName = (user) => `${HIDDEN_DISPLAY_NAME}${hiddenUserCode(user)}`;

/** Gizli kullanıcı modu açık ve VIP seviyesi yeterliyse kişi odalarda kimliğini göstermez. */
export const isHiddenUser = (user) => !!user?.hidden_user && vipActive(user) && vipLevelOf(user) >= HIDDEN_REQUIRED_VIP;