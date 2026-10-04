/** Gizli kullanıcının odalarda görünen takma adı — isim, kimlik ve profil taşımaz. */
export const HIDDEN_DISPLAY_NAME = 'Gizli Kullanıcı';

/** Bir sohbet/koltuk etiketi gizli kullanıcıya mı ait? */
export const isHiddenName = (name) => name === HIDDEN_DISPLAY_NAME;