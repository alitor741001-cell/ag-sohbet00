import { useNavigate } from 'react-router-dom';
import { Check, Video, X } from 'lucide-react';
import usePkInvite from '@/hooks/usePkInvite';
import { useToast } from '@/components/ui/use-toast';

/**
 * Görüntülü PK daveti: kişi hangi ekranda olursa olsun davet anında kart olarak gelir.
 * Kabul edilince davet eden kişinin odasına gidilir ve yayın ekranı kendiliğinden açılır.
 */
export default function PkInviteOverlay({ userId }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { invite, busy, accept, decline } = usePkInvite(userId);

  if (!invite) return null;

  const hostName = invite.host_name || 'Bir kullanıcı';
  const rematch = Number(invite.round_no) > 1;

  const fail = (error) => toast({
    title: 'Davet yanıtlanamadı',
    description: error?.response?.data?.error || error.message,
    variant: 'destructive',
  });

  const go = async () => {
    try {
      await accept();
      // Kişi zaten davet edenin odasındaysa yerinden edilmez: PK ekranı olduğu yerde açılır.
      const target = invite.room_id ? `/sesli-oda/${invite.room_id}` : '';
      if (target && window.location.pathname !== target) navigate(target);
    } catch (error) { fail(error); }
  };

  const refuse = async () => {
    try { await decline(); } catch (error) { fail(error); }
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/85 px-6 backdrop-blur-sm">
      <div className="room-notif-in w-full max-w-sm rounded-3xl border border-fuchsia-300/40 bg-gradient-to-b from-[#220d2c] to-[#12060f] p-5 text-center shadow-[0_0_50px_-12px_rgba(217,70,239,0.95)]">
        <span className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full ring-2 ring-fuchsia-400/70">
          {invite.host_avatar
            ? <img src={invite.host_avatar} alt="" className="h-full w-full object-cover" />
            : <Video className="h-7 w-7 text-fuchsia-300" />}
        </span>

        <p className="mt-3 text-[13.5px] font-black leading-snug text-white">
          {hostName} sizi PK için davet ediyor
        </p>
        <p className="mt-1 text-[11px] font-semibold text-white/55">
          {rematch ? 'Rövanş isteği' : 'Görüntülü PK'}{invite.room_name ? ` · ${invite.room_name}` : ''}
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={go}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-[12.5px] font-black text-black active:scale-95 disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> Kabul et
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={refuse}
            className="flex h-11 items-center justify-center gap-1 rounded-xl bg-white/10 px-4 text-[12.5px] font-bold text-white/75 active:scale-95 disabled:opacity-50"
          >
            <X className="h-4 w-4" /> Reddet
          </button>
        </div>
      </div>
    </div>
  );
}