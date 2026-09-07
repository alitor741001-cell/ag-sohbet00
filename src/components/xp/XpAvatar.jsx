import ProfileFrame from '@/components/ProfileFrame';

export default function XpAvatar({ user, src, size = 80, className = '' }) {
  return <ProfileFrame user={user} src={src} size={size} className={className} />;
}