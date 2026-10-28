import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, Radio, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { useToast } from '@/components/ui/use-toast';
import { useUserProfile } from '@/lib/profileCard';
import SearchPersonActions from '@/components/friends/SearchPersonActions';

const isVoice = (room) => room?.room_type === 'voice' || room?.voice_mode === true;

/** Üye numarasıyla kişi arama: sonuç karta dönüşür, yayındaysa odaya git düğmesi çıkar. */
export default function FriendSearchSheet({ open, onClose }) {
  const navigate = useNavigate();
  const { openUserProfile } = useUserProfile();
  const { toast } = useToast();
  const [memberId, setMemberId] = useState('');
  const [person, setPerson] = useState(null);
  const [liveRoom, setLiveRoom] = useState(null);
  const [searching, setSearching] = useState(false);

  const close = () => {
    setMemberId('');
    setPerson(null);
    setLiveRoom(null);
    onClose?.();
  };

  const search = async () => {
    const value = memberId.replace(/[^0-9]/g, '');
    if (value.length !== 8) {
      toast({ title: '8 haneli üye numarası girin', variant: 'destructive' });
      return;
    }
    setSearching(true);
    setPerson(null);
    setLiveRoom(null);
    try {
      const response = await base44.functions.invoke('friend-service', { action: 'search', member_id: value });
      const found = response.data?.user;
      if (!found) {
        toast({ title: 'Üye bulunamadı', description: 'Numarayı kontrol edin.' });
        return;
      }
      setPerson(found);
      const rooms = await base44.entities.Room.filter({ status: 'active' }, '-created_date', 100).catch(() => []);
      const room = (rooms || []).find(
        (item) =>
          (item.participants || []).some((row) => row.user_id === found.id) ||
          (item.seats || []).some((seat) => seat.user_id === found.id)
      );
      if (room) setLiveRoom(room);
    } catch (error) {
      toast({ title: 'Arama başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="max-w-md border-[#7dd3fc]/30 bg-[linear-gradient(180deg,#0B2A52,#05122A)] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#a5e4ff]">
            <Search className="h-4 w-4" /> Üye Ara
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <input
            value={memberId}
            onChange={(event) => setMemberId(event.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
            onKeyDown={(event) => { if (event.key === 'Enter') search(); }}
            inputMode="numeric"
            placeholder="8 haneli üye numarası"
            className="w-full rounded-xl border border-[#7dd3fc]/35 bg-[#061a38] px-3 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:border-[#6fe6dc]/70"
          />
          <button
            type="button"
            onClick={search}
            disabled={searching}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#062033] disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#d8fffb,#6fe6dc 55%,#9ad7ff)' }}
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </div>

        {person && (
          <div className="relative mt-2 flex flex-col gap-2 rounded-2xl border border-[#7dd3fc]/30 bg-[#08203f]/80 p-3">
            <div className="relative flex w-full items-center gap-3">
            {liveRoom && (
              <button
                type="button"
                onClick={() => { navigate(isVoice(liveRoom) ? `/sesli-oda/${liveRoom.id}` : `/oda/${liveRoom.id}`); close(); }}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-[#ff8a8a]/60 bg-[#3a0d1a]/90 px-2 py-1 text-[9.5px] font-black text-[#ffd6d6]"
              >
                <Radio className="h-3 w-3 animate-pulse" /> Odaya Git
              </button>
            )}
            <button
              type="button"
              onClick={() => { close(); openUserProfile(person.id); }}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              {person.avatar ? (
                <Image src={person.avatar} className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#6fe6dc]/50" fittingType="fill" alt="" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#12395f] text-lg font-black text-[#a5e4ff]">
                  {(person.name || '?')[0]}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-white">{person.name}</span>
                <span className="mt-0.5 block text-[11px] font-semibold text-[#a5e4ff]/80">Üye No: {person.member_id || '—'}</span>
                <span className="mt-0.5 block text-[10px] font-semibold text-white/45">{liveRoom ? 'Şu an yayında' : 'Şu an odada değil'}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
            </button>
            </div>
            <SearchPersonActions userId={person.id} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}