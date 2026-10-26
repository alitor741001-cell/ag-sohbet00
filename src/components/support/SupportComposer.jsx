import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Image as ImageIcon, Loader2, Send, Video } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Sınırlar: fotoğraf 10 MB, video en fazla 30 saniye ve 25 MB.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 30;

/** Videonun süresini saniye olarak okur; okunamazsa 0 döner. */
function readVideoSeconds(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(probe.duration || 0); };
    probe.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    probe.src = url;
  });
}

/**
 * Üye mesaj kutusu: doğrudan yazılır; ek düğmesine basınca fotoğraf ve video
 * seçenekleri açılır. Fotoğraf ve videolar herkese açık adrese yüklenir.
 */
export default function SupportComposer({ onSendText, onSendMedia, busy = false }) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef(null);
  const videoRef = useRef(null);
  const picking = uploading || busy;

  const fail = (title, description) => toast({ title, description, variant: 'destructive' });

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || picking) return;
    if (await onSendText(value) !== false) setText('');
  };

  const onFile = async (e, kind) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (kind === 'video') {
      if (!file.type.startsWith('video/')) return fail('Sadece video dosyası gönderilebilir');
      if (file.size > MAX_VIDEO_BYTES) return fail('Video en fazla 25 MB olabilir');
      const seconds = await readVideoSeconds(file);
      if (seconds > MAX_VIDEO_SECONDS + 0.5) return fail('Video en fazla 30 saniye olabilir', `Seçtiğiniz video ${Math.ceil(seconds)} saniye.`);
    } else {
      if (!file.type.startsWith('image/')) return fail('Sadece fotoğraf gönderilebilir');
      if (file.size > MAX_IMAGE_BYTES) return fail('Fotoğraf en fazla 10 MB olabilir');
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await onSendMedia(file_url, kind === 'video' ? 'video' : 'image');
    } catch {
      fail('Yükleme hatası', 'Dosya gönderilemedi, tekrar deneyin.');
    }
    setUploading(false);
  };

  return (
    <form onSubmit={submit} className="support-composer flex shrink-0 items-center gap-2 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenu((m) => !m)}
          disabled={picking}
          title="Fotoğraf veya video gönder"
          className="rounded-lg p-2 hover:bg-secondary disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
        </button>
        {menu && (
          <div className="absolute bottom-12 left-0 z-20 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
            <button type="button" onClick={() => { setMenu(false); photoRef.current?.click(); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary">
              <ImageIcon className="h-4 w-4 text-primary" /> Fotoğraf
            </button>
            <button type="button" onClick={() => { setMenu(false); videoRef.current?.click(); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary">
              <Video className="h-4 w-4 text-primary" /> Video · en fazla 30 sn
            </button>
          </div>
        )}
        <input ref={photoRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e, 'image')} />
        <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => onFile(e, 'video')} />
      </div>
      <input
        maxLength={2000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Mesajınızı yazın..."
        className="min-w-0 flex-1 rounded-full bg-secondary/60 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <button type="submit" disabled={picking || !text.trim()} className="shrink-0 rounded-full bg-primary p-2.5 text-primary-foreground disabled:opacity-50">
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}