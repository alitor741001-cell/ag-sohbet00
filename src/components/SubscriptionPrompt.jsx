import { useNavigate } from 'react-router-dom';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscriptionPrompt({ title = 'Abonelik Gerekli', description = 'Bu içeriği görüntülemek için aktif aboneliğinizin olması gerekiyor.' }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-purple-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      <Button onClick={() => navigate('/abonelik')} className="bg-purple-600 hover:bg-purple-700 text-white">
        <Crown className="w-4 h-4 mr-2" /> Aboneliği Aktif Et
      </Button>
    </div>
  );
}