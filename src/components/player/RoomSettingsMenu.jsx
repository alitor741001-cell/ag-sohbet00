import { X, Users, Lock, Globe, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export default function RoomSettingsMenu({ room, onClose }) {
  const navigate = useNavigate();

  const leaveRoom = async () => {
    try {
      await base44.functions.invoke('update-presence', { action: 'leave', room_id: room.id });
      navigate('/acik-odalar');
    } catch (err) {
      toast({ title: 'Hata', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Oda Ayarları</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span className="text-sm text-muted-foreground">Gizlilik</span>
            <span className="flex items-center gap-1 text-sm text-white">{room.is_private ? <><Lock className="w-4 h-4 text-amber-400" /> Gizli</> : <><Globe className="w-4 h-4 text-green-400" /> Açık</>}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span className="text-sm text-muted-foreground">Katılımcı</span>
            <span className="flex items-center gap-1 text-sm text-white"><Users className="w-4 h-4" /> {room.participants?.length || 0}</span>
          </div>
          <button onClick={leaveRoom} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30">
            <LogOut className="w-4 h-4" /> Odadan Ayrıl
          </button>
        </div>
      </div>
    </div>
  );
}