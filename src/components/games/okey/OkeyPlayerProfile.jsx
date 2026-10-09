import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import FullUserProfile from '@/components/profile/FullUserProfile';

/**
 * Okey masasındaki bir oyuncuya dokununca açılan kart.
 * Özel sohbetteki profil kartının aynısıdır: bilgiler görünür, "Mesaj Yaz" o kişiyle sohbeti başlatır.
 */
export default function OkeyPlayerProfile({ player, onClose }) {
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

  if (!player?.user_id) return null;

  return (
    <FullUserProfile
      userId={player.user_id}
      name={player.name || ''}
      avatar={player.avatar || ''}
      level={Number(player.level) || 0}
      onClose={onClose}
      onMessage={startChat}
    />
  );
}