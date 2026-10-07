import { Image } from '@/components/ui/image';
import { isVideoAttachment } from '@/lib/supportMedia';

/** Destek mesajı eki: video oynatıcı olarak, fotoğraf optimize edilmiş görsel olarak gösterilir. */
export default function SupportAttachment({ message, className = 'max-h-40 max-w-full rounded-lg', onImageClick }) {
  if (!message?.file_url) return null;
  if (isVideoAttachment(message)) {
    return <video src={message.file_url} controls playsInline preload="metadata" className={className} />;
  }
  return (
    <Image
      src={message.file_url}
      alt="ek"
      className={className}
      fittingType="fit"
      onClick={onImageClick ? () => onImageClick(message.file_url) : undefined}
    />
  );
}