import { Image } from '@/components/ui/image';

export default function ReferencePortrait({ avatar, name, small = false }) {
  return <div className={small ? 'reference-portrait reference-portrait-small' : 'reference-portrait'}>
    {avatar ? <Image src={avatar} alt={name} className="h-full w-full rounded-full" fittingType="fill" /> : <span>{name?.[0] || '?'}</span>}
  </div>;
}