import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

const OPTIONS = [
  { key: 'kadın', label: 'Kadın', hint: 'Pembe tema', symbol: '♀' },
  { key: 'erkek', label: 'Erkek', hint: 'Mavi-kırmızı tema', symbol: '♂' },
];

/** Yönetici için cinsiyet düzeltme kartı: seçilen cinsiyet profil kartının rengini belirler. */
export default function UserGenderDialog({ user, onClose, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState('');

  if (!user) return null;

  const apply = async (gender) => {
    if (saving) return;
    setSaving(gender);
    try {
      await base44.entities.User.update(user.id, { gender });
      await onSaved?.(user, gender);
    } catch (error) {
      toast({ title: 'Cinsiyet güncellenemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5" onClick={(event) => event.stopPropagation()}>
        <h3 className="mb-1 font-bold">Cinsiyet değiştir</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          {user.username || user.full_name || user.email} — seçilen cinsiyet kullanıcının profil kartı rengini belirler.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              disabled={!!saving}
              onClick={() => apply(option.key)}
              className={`rounded-xl border p-3 text-center disabled:opacity-50 ${user.gender === option.key ? 'border-primary bg-primary/10' : 'border-border bg-secondary/40'}`}
            >
              <span className="block text-2xl">{option.symbol}</span>
              <span className="block text-sm font-bold">{option.label}</span>
              <span className="block text-[10px] text-muted-foreground">{option.hint}</span>
            </button>
          ))}
        </div>
        {saving && (
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Kaydediliyor...
          </p>
        )}
        <button onClick={onClose} disabled={!!saving} className="mt-4 w-full rounded-lg bg-secondary px-4 py-2 text-sm disabled:opacity-50">Kapat</button>
      </div>
    </div>
  );
}