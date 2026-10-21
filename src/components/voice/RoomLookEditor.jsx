import { useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import VoiceRoomThemePanel from '@/components/voice/VoiceRoomThemePanel';

/**
 * Oda panelinden oda görünümü: kapak fotoğrafı ve tema.
 * Değişiklik anında odadaki herkesin ekranına yansır.
 */
export default function RoomLookEditor({ background, cover, onSave }) {
  const [localCover, setLocalCover] = useState('');
  const [uploading, setUploading] = useState(false);

  const pickCover = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    // Yerel önizleme: fotoğraf seçildiği anda görünür.
    const preview = URL.createObjectURL(file);
    setLocalCover(preview);
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setLocalCover('');
      await onSave?.({ cover_url: file_url });
    } finally {
      setUploading(false);
      URL.revokeObjectURL(preview);
    }
  };

  const shown = localCover || cover;

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[11px] font-black tracking-[0.12em] text-[#FFD700]">ODA KAPAĞI</p>
      <div className="flex items-center gap-2">
        <label className="relative flex h-20 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06]">
          {shown ? (
            <Image src={shown} alt="Oda kapağı" fittingType="fill" className="absolute inset-0 h-full w-full" />
          ) : (
            <ImagePlus className="h-5 w-5 text-white/50" />
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
          )}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pickCover} disabled={uploading} />
        </label>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] leading-snug text-white/55">Kapağa dokunup galeriden fotoğraf seç. Seçtiğin an herkese yansır.</p>
          {shown && !uploading && (
            <button
              type="button"
              onClick={() => { setLocalCover(''); onSave?.({ cover_url: '' }); }}
              className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-white/60 active:scale-95"
            >
              <Trash2 className="h-3 w-3" /> Kapağı kaldır
            </button>
          )}
        </div>
      </div>

      <VoiceRoomThemePanel value={background} onPick={(key) => onSave?.({ background: key })} />
    </div>
  );
}