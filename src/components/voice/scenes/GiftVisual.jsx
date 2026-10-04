import { Image } from '@/components/ui/image';

/** Sahnedeki hediye görseli: görsel varsa resmi, yoksa emojisini gösterir. */
export default function GiftVisual({ imageUrl, emoji, name, className = 'h-10 w-10', emojiClassName = 'text-[26px]' }) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name || 'Hediye'}
        className={className}
        fittingType="fit"
        originWidth={192}
        originHeight={192}
      />
    );
  }

  return (
    <span className={`flex items-center justify-center leading-none ${className} ${emojiClassName}`}>
      {emoji || '🎁'}
    </span>
  );
}