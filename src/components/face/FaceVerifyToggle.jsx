import { useEffect, useState } from 'react';
import { ScanFace } from 'lucide-react';
import { faceStatus, setFaceEnabled } from '@/lib/faceCheck';
import { useToast } from '@/components/ui/use-toast';

/** Eklentiler bölümündeki anahtar: yüz doğrulaması istemlerini açar/kapatır. */
export default function FaceVerifyToggle({ user }) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return undefined;
    let alive = true;
    faceStatus(user.id)
      .then((status) => { if (alive) setEnabled(status.enabled !== false); })
      .catch(() => {});
    return () => { alive = false; };
  }, [user?.id]);

  const change = async () => {
    if (saving || enabled === null) return;
    const next = !enabled;
    setSaving(true);
    setEnabled(next);
    try {
      await setFaceEnabled(next);
      toast({
        title: next ? 'Yüz doğrulaması açıldı' : 'Yüz doğrulaması kapatıldı',
        description: next
          ? 'Yüzünüz bir kez alınır; yeni cihazlarda ve güncellemelerden sonra tekrar sorulmaz.'
          : 'Yüz doğrulaması istenmez.',
      });
    } catch (e) {
      setEnabled(!next);
      toast({ title: 'Ayar kaydedilemedi', description: e?.response?.data?.error || e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const on = enabled === true;
  return (
    <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-gold/10">
        <ScanFace className="h-5 w-5 text-premium-gold" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-foreground">Yüz Doğrulaması</p>
        <p className="text-xs text-muted-foreground">
          {enabled === null
            ? 'Durum yükleniyor...'
            : on
              ? 'Açık — yüzünüz bir kez alınır, bir daha sorulmaz.'
              : 'Kapalı — yüz doğrulaması istenmez.'}
        </p>
      </div>
      <button
        type="button"
        onClick={change}
        disabled={saving || enabled === null}
        aria-pressed={on}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition disabled:opacity-50 ${on ? 'border-premium-gold bg-premium-red/70' : 'border-border bg-secondary'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-0.5'}`}
        />
      </button>
    </section>
  );
}