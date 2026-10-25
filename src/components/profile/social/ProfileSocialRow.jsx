import FollowButton from '@/components/profile/social/FollowButton';
import FriendButton from '@/components/profile/social/FriendButton';

/** Profil kartlarının sosyal satırı: küçük Takip Et ve Arkadaş Ekle düğmeleri yan yana. */
export default function ProfileSocialRow({ userId, accent = '#6fe6dc', onChange }) {
  return (
    <div className="flex w-full items-stretch gap-1.5">
      <div className="flex min-w-0 flex-1">
        <FollowButton userId={userId} accent={accent} compact onChange={onChange} />
      </div>
      <div className="flex min-w-0 flex-1">
        <FriendButton userId={userId} accent={accent} compact onChange={onChange} />
      </div>
    </div>
  );
}