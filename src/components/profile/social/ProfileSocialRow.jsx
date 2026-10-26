import FollowButton from '@/components/profile/social/FollowButton';
import FriendButton from '@/components/profile/social/FriendButton';
import BlockButton from '@/components/profile/social/BlockButton';

export default function ProfileSocialRow({ userId, accent = '#6fe6dc', onChange, leadingAction }) {
  return (
    <div className="w-full space-y-1.5" onClick={event => event.stopPropagation()}>
      <div className={leadingAction ? 'grid grid-cols-2 items-stretch gap-1.5' : 'flex items-stretch'}>
        {leadingAction && <div className="flex min-w-0">{leadingAction}</div>}
        <div className="flex min-w-0 flex-1"><FollowButton userId={userId} accent={accent} compact onChange={onChange} /></div>
      </div>
      <div className="grid grid-cols-2 items-stretch gap-1.5">
        <FriendButton userId={userId} accent={accent} compact onChange={onChange} />
        <BlockButton userId={userId} accent={accent} onChange={onChange} />
      </div>
    </div>
  );
}