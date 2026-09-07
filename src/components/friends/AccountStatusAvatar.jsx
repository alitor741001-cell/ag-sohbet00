import ProfileFrame from '@/components/ProfileFrame';

export default function AccountStatusAvatar({ user, size = 40 }) {
  const status = user?.membership_status;
  const ringColor = status === 'active' ? 'ring-green-500/40' : status === 'suspended' ? 'ring-amber-500/40' : status === 'banned' ? 'ring-red-500/40' : 'ring-white/10';
  return (
    <div className={`rounded-full ring-2 ${ringColor}`}>
      <ProfileFrame user={user} src={user?.avatar} size={size} showFrame={false} />
    </div>
  );
}