import { Camera, CameraOff, Mic, MicOff, UserPlus } from 'lucide-react';
import VoiceSheet from '@/components/voice/VoiceSheet';

/** Yayıncı kontrolleri: kamera, mikrofon ve davet tek panelde toplanır.
 *  Yalnızca oda sahibi görür; izleyiciler ve yöneticiler bu düğmelere ulaşamaz. */
export default function PkOwnerControls({ open, onClose, camOn = true, micMuted = false, canInvite = true, onToggleCamera, onToggleMic, onInvite }) {
  const tiles = [
    { key: 'cam', label: camOn ? 'Kamerayı kapat' : 'Kamerayı aç', icon: camOn ? Camera : CameraOff, onClick: onToggleCamera },
    { key: 'mic', label: micMuted ? 'Mikrofonu aç' : 'Mikrofonu kapat', icon: micMuted ? MicOff : Mic, onClick: onToggleMic },
    ...(canInvite ? [{ key: 'invite', label: 'Yayına davet et', icon: UserPlus, onClick: onInvite }] : []),
  ];

  return (
    <VoiceSheet open={open} onClose={onClose} title="Yayın kontrolleri">
      <div className="grid grid-cols-3 gap-2 pb-1">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            onClick={tile.onClick}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-1 py-3 text-[11px] font-bold text-white active:scale-95"
          >
            <tile.icon className="h-5 w-5 text-[#25f4ee]" />
            <span className="text-center leading-tight">{tile.label}</span>
          </button>
        ))}
      </div>
    </VoiceSheet>
  );
}