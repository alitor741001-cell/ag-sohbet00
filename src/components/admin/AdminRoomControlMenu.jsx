import { useState } from 'react';
import { MoreVertical, Film, Mic, Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

/**
 * Açık odalar listesindeki "3 nokta" menüsü: yönetici her odanın türünü değiştirebilir
 * ve odanın yönetimini devralabilir. Yalnızca admin hesaplarında görünür.
 */
export default function AdminRoomControlMenu({ room }) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  if (user?.role !== 'admin' || !room?.id) return null;

  const run = async (task, message) => {
    setBusy(true);
    try {
      await base44.functions.invoke('room-presence', { action: 'admin-room', room_id: room.id, task });
      toast({ title: message });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Oda yönetimi"
          disabled={busy}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 disabled:opacity-40"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => run('film', 'Oda film odasına çevrildi')}>
          <Film className="mr-2 h-4 w-4" /> Film Odasına Geçir
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run('voice', 'Oda sesli odaya çevrildi')}>
          <Mic className="mr-2 h-4 w-4" /> Sesli Odaya Geçir
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run('manage', 'Odanın yönetimi alındı')}>
          <Crown className="mr-2 h-4 w-4" /> Yönetimi Ele Al
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}