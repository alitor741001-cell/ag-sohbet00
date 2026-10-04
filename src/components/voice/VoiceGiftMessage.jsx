import { giftById } from '@/lib/gifts';

/** Sohbet akışındaki hediye satırı: kim, hangi hediyeyi gönderdi. */
export default function VoiceGiftMessage({ message }) {
  const gift = giftById(message.gift);
  return (
    <div className="flex items-center justify-center gap-2 rounded-full border border-amber-300/30 bg-gradient-to-r from-amber-500/15 via-pink-500/15 to-amber-500/15 px-3 py-1.5">
      <span className="text-lg leading-none">{gift?.emoji || '🎁'}</span>
      <p className="text-[11px] font-bold text-amber-200">
        {message.user_name} {gift ? `${gift.name} hediyesi gönderdi!` : 'hediye gönderdi!'}
      </p>
    </div>
  );
}