import { giftMotion } from '@/lib/giftMotion';

/** Sohbet akışındaki hediye satırı: kim, kime, hangi hediye ve K değeri. */
export default function VoiceGiftMessage({ message }) {
  const { motion, tone } = giftMotion({ id: message.gift_id || message.gift_emoji, name: message.gift_name });

  return (
    <div className="flex items-center justify-center gap-2 rounded-full border border-amber-300/30 bg-gradient-to-r from-amber-500/15 via-pink-500/15 to-amber-500/15 px-3 py-1.5">
      <span className="gift-shine relative inline-flex items-center justify-center" style={{ '--gift-tone': tone }}>
        <span className={`${motion} text-lg leading-none`}>{message.gift_emoji || '🎁'}</span>
      </span>
      <p className="text-[11px] font-bold text-amber-200">{message.text || `${message.user_name} hediye gönderdi!`}</p>
    </div>
  );
}