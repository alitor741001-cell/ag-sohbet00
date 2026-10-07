import { Image } from '@/components/ui/image';

export const ACCOUNT_STATES = {
  deleted: {
    status: 'deleted',
    image: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/0665aaba3_generated_image.png',
    name: 'Silinmiş Hesap',
    message: 'Bu hesap yönetici tarafından silinmiştir.'
  },
  banned: {
    status: 'banned',
    image: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/63e635ef8_generated_image.png',
    name: 'Engellenmiş Hesap',
    message: 'Bu hesap yönetici tarafından engellenmiştir.'
  },
  suspended: {
    status: 'suspended',
    image: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/d59dc5667_generated_image.png',
    name: 'Askıya Alınmış Hesap',
    message: 'Bu hesap yönetici tarafından askıya alınmıştır.'
  }
};

export function getAccountState(profile, fallbackText = '') {
  const fallback = Object.entries(ACCOUNT_STATES).find(([, state]) => state.name === fallbackText || state.message === fallbackText);
  if (fallback) return ACCOUNT_STATES[fallback[0]];
  const status = profile?.account_status;
  return status && status !== 'active' ? ACCOUNT_STATES[status] : null;
}

/** Durum işaretinin altındaki etiket: kart üstünde büyük harfle yazılır. */
export const ACCOUNT_MARKS = {
  banned: 'BANNED',
  deleted: 'DELETED',
  suspended: 'SUSPENDED'
};

/**
 * Profil kartındaki durum işareti: kişinin kendi fotoğrafı grileşir, üzerine 🚫
 * basılır ve altına durum adı yazılır. Engellenen, askıya alınan ve silinen
 * hesapta görünüm aynıdır.
 */
export function AccountStatusMark({ status, avatar = '', name = '', size = 'h-28 w-28', markClass = 'text-3xl' }) {
  const state = ACCOUNT_STATES[status] || ACCOUNT_STATES.deleted;
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div className="mx-auto w-fit">
      <div className={`relative mx-auto ${size}`}>
        {avatar ? (
          <Image
            src={avatar}
            alt={state.name}
            className={`${size} overflow-hidden rounded-full border border-border object-cover grayscale`}
            fittingType="fill"
          />
        ) : (
          <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-4xl font-bold ${size}`}>{initial}</div>
        )}
        <span className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/55 ${markClass}`}>🚫</span>
      </div>
      <p className="mt-2 text-center text-[11px] font-black tracking-[0.3em] text-destructive">{ACCOUNT_MARKS[status] || ACCOUNT_MARKS.deleted}</p>
    </div>
  );
}

export default function AccountStatusAvatar({ status, className = 'h-12 w-12' }) {
  const state = ACCOUNT_STATES[status] || ACCOUNT_STATES.deleted;
  return <Image src={state.image} alt={state.name} className={`${className} rounded-full border border-border`} fittingType="fill" />;
}