import { useNavigate } from 'react-router-dom';
import SupportAvatarButton from '@/components/layout/SupportAvatarButton';

/** Kullanıcı tarafı canlı destek: alt menüde profil sekmesinin yanında durur, basınca destek sohbeti açılır. */
export default function UserSupportButton() {
  const navigate = useNavigate();
  return <SupportAvatarButton onClick={() => navigate('/destek')} />;
}