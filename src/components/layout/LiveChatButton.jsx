import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useSupportBadge from '@/hooks/useSupportBadge';
import SupportAvatarButton from '@/components/layout/SupportAvatarButton';

/** Every support entry opens the same inbox with the same routing permissions. */
export default function LiveChatButton() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const badge = useSupportBadge(user?.id);
  return <SupportAvatarButton onClick={() => navigate('/destek')} badge={badge} title="Canlı Destek" />;
}