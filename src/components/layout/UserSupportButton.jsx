import { useNavigate } from 'react-router-dom';
import SupportAvatarButton from '@/components/layout/SupportAvatarButton';

/** Kullanıcı tarafı canlı destek: alt menüde profil sekmesinin yanında durur, basınca destek sohbeti açılır.
 *  Okunmamış yönetici yanıtı varsa düğmenin üstünde özel sohbetlerdeki gibi sayı rozeti görünür. */
export default function UserSupportButton({ badge = 0 }) {
  const navigate = useNavigate();
  return <SupportAvatarButton onClick={() => navigate('/destek')} badge={badge} />;
}