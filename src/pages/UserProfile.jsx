import { useParams, useNavigate } from 'react-router-dom';
import FullUserProfile from '@/components/profile/FullUserProfile';
import ProfileLiveLink from '@/components/profile/social/ProfileLiveLink';
import useActiveRooms from '@/hooks/useActiveRooms';
import { findLiveRoom } from '@/lib/liveRoom';

/**
 * Tam sayfa profil: sesli odadaki kartın aynısı (kadın pembe, erkek mavi) ayrı sayfada
 * tam yükseklikte açılır. Geri düğmesi profilin açıldığı yere — listeye ya da sohbete —
 * döner; geçmiş yoksa profilin kendi sayfasına gider.
 */
export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rooms, getRoomId } = useActiveRooms();
  const liveRoom = findLiveRoom(rooms, id, getRoomId(id));

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/profil');
  };

  return (
    <FullUserProfile
      open
      userId={id}
      onClose={goBack}
      extra={liveRoom ? <div className="flex justify-center"><ProfileLiveLink liveRoom={liveRoom} /></div> : null}
    />
  );
}