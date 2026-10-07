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
export function AccountStatusMark({ status, size = 'h-28 w-28', showLabel = true }) {
  const state = ACCOUNT_STATES[status] || ACCOUNT_STATES.deleted;
  return (
    <div className="mx-auto w-fit">
      <Image
        src={state.image}
        alt={state.name}
        className={`${size} overflow-hidden rounded-full border border-border object-cover`}
        fittingType="fill"
      />
      {showLabel && <p className="mt-2 text-center text-[11px] font-black tracking-[0.3em] text-destructive">{ACCOUNT_MARKS[status] || ACCOUNT_MARKS.deleted}</p>}
    </div>
  );
}

export default function AccountStatusAvatar({ status, className = 'h-12 w-12' }) {
  const state = ACCOUNT_STATES[status] || ACCOUNT_STATES.deleted;
  return <Image src={state.image} alt={state.name} className={`${className} overflow-hidden rounded-full border border-border object-cover`} fittingType="fill" />;
}