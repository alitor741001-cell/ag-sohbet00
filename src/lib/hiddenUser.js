/** Gizli kullanıcının odalarda görünen takma adı — isim, kimlik ve profil taşımaz. */
export const HIDDEN_DISPLAY_NAME = 'Gizli Kullanıcı';

/** Gizli kullanıcının siyah-altın maskeli profil görseli: gerçek fotoğraf yerine bu görünür. */
export const HIDDEN_AVATAR_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/df5f81e7b_IMG_1373.jpeg';

/** Takma ad her zaman 8 haneli numarayla biter, gerçek kimliği belli etmez. */
export const isHiddenName = (name) => typeof name === 'string' && name.startsWith(HIDDEN_DISPLAY_NAME);