import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import FullUserProfile from '@/components/profile/FullUserProfile';

/**
 * Yayıncı panelinde profile dokununca açılan kart.
 * Odalardaki özel sohbet profil kartının aynısıdır; "Mesaj Yaz" sohbeti başlatır.
 */
export default function AgencyBroadcasterProfile({ member, onClose }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const startChat = async (userId) => {
    try {
      const res = await base44.functions.invoke('dm-service', { action: 'start', target_id: userId });
      if (res?.data?.conversation) navigate(`/arkadaslar?view=chats&chat=${res.data.conversation.id}`);
    } catch (error) {
      toast({ title: 'Sohbet açılamadı', description: error.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  if (!member?.user_id) return null;

  return (
    <FullUserProfile
      userId={member.user_id}
      name={member.name}
      avatar={member.avatar}
      onClose={onClose}
      onMessage={startChat}
    />
  );
}