import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/** Ayar alt sayfalarının ortak başlığı: geri düğmesi ve başlık. */
export default function SettingsPageHeader({ title, subtitle, backTo = '/profil/ayarlar' }) {
  const navigate = useNavigate();
  return (
    <div className="mb-4 flex items-center gap-2">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        aria-label="Geri"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white active:scale-95"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="min-w-0">
        <h1 className="text-lg font-black text-white">{title}</h1>
        {subtitle && <p className="text-[11px] font-semibold text-white/45">{subtitle}</p>}
      </div>
    </div>
  );
}