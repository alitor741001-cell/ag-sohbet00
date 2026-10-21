import { useState } from 'react';
import { ChevronDown, EyeOff, KeyRound, Lock, Palette, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import ThemeModeSelector from '@/components/profile/ThemeModeSelector';
import HiddenUserCard from '@/components/profile/HiddenUserCard';

const CARD =
  'rounded-2xl p-[1px]';
const CARD_INNER =
  'rounded-2xl px-4 py-4';
const CARD_BG = { background: 'linear-gradient(160deg, rgba(18,58,112,0.95), rgba(6,22,48,0.95))' };
const CARD_BORDER = { background: 'linear-gradient(135deg, rgba(125,211,252,0.8), rgba(37,99,235,0.2) 50%, rgba(125,211,252,0.6))' };
const ICON_BOX = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl';
const ICON_STYLE = { background: 'rgba(56,189,248,0.14)', border: '1px solid rgba(125,211,252,0.35)' };

/** Profil ayarları: mavi kristal paneller içinde tema, gizli hesap ve şifre. */
export default function ProfileSettings({ user, onUpdated }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });

  const submit = async (event) => {
    event.preventDefault();
    if (form.next.length < 8) {
      toast({ title: 'Yeni şifre en az 8 karakter olmalıdır', variant: 'destructive' });
      return;
    }
    if (form.next !== form.confirm) {
      toast({ title: 'Yeni şifreler eşleşmiyor', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.auth.changePassword({ userId: user.id, currentPassword: form.current, newPassword: form.next });
      setForm({ current: '', next: '', confirm: '' });
      toast({ title: 'Şifreniz değiştirildi' });
    } catch (error) {
      toast({ title: 'Şifre değiştirilemedi', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Panel icon={Palette} title="Görünüm" subtitle="Uygulama temasını seç">
        <ThemeModeSelector />
      </Panel>

      <Panel icon={EyeOff} title="Gizli Hesap" subtitle="Profilini diğer üyelerden sakla">
        <HiddenUserCard user={user} onUpdated={onUpdated} />
      </Panel>

      <div className={CARD} style={CARD_BORDER}>
        <div className={CARD_INNER} style={CARD_BG}>
          <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 text-left">
            <span className={ICON_BOX} style={ICON_STYLE}><KeyRound className="h-5 w-5 text-[#a5e4ff]" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-white">Şifre Değiştir</span>
              <span className="block text-[11px] font-semibold text-[#a5e4ff]/70">Hesabının şifresini güncelle</span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-[#a5e4ff]/70 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <form onSubmit={submit} className="mt-3 space-y-2.5">
              <Password label="Mevcut Şifre" value={form.current} onChange={(current) => setForm({ ...form, current })} />
              <Password label="Yeni Şifre" value={form.next} onChange={(next) => setForm({ ...form, next })} />
              <Password label="Yeni Şifre Tekrar" value={form.confirm} onChange={(confirm) => setForm({ ...form, confirm })} />
              <button
                type="submit"
                disabled={saving}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-[#052033] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#d8fffb 0%,#6fe6dc 50%,#9ad7ff 100%)' }}
              >
                <ShieldCheck className="h-4 w-4" /> {saving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({ icon: Icon, title, subtitle, children }) {
  return (
    <div className={CARD} style={CARD_BORDER}>
      <div className={CARD_INNER} style={CARD_BG}>
        <div className="mb-3 flex items-center gap-3">
          <span className={ICON_BOX} style={ICON_STYLE}><Icon className="h-5 w-5 text-[#a5e4ff]" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black text-white">{title}</span>
            <span className="block text-[11px] font-semibold text-[#a5e4ff]/70">{subtitle}</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Password({ label, value, onChange }) {
  return (
    <label className="block text-[11px] font-bold text-[#a5e4ff]/80">
      {label}
      <span className="relative mt-1 block">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a5e4ff]/50" />
        <input
          required
          type="password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-[#7dd3fc]/30 bg-[#04162f] py-2.5 pl-9 pr-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#6fe6dc]/70"
        />
      </span>
    </label>
  );
}