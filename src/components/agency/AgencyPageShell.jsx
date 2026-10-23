import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AGENCY_GOLD } from '@/lib/agency';

/** Ajans alt sayfalarının ortak kabuğu: geri düğmesi, bölüm menüsü ve içerik alanı. */
export default function AgencyPageShell({ title, subtitle = '', sections = [], loading = false, children }) {
  const navigate = useNavigate();

  return (
    <div className="dark mx-auto min-h-screen max-w-3xl bg-transparent px-4 py-5 pb-24 text-foreground sm:px-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Geri"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="truncate text-[11px] text-white/50">{subtitle}</p>}
        </div>
      </header>

      {sections.length > 0 && (
        <nav aria-label="Ajans bölümleri" className="mb-5 mt-5 grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-card p-2 sm:grid-cols-3">
          {sections.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              {item.icon && <item.icon className="h-3.5 w-3.5 shrink-0" />}{item.label}
            </NavLink>
          ))}
        </nav>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: AGENCY_GOLD }} />
        </div>
      ) : sections.length === 0 ? (
        <div className="rounded-2xl border border-[#F5C542]/30 bg-white/5 px-4 py-10 text-center">
          <p className="text-sm font-bold text-white">Ajans bölümü için önce bir ajansa katıl</p>
          <p className="mt-1 text-[11px] text-white/50">Kendi ajansını kur ya da gelen davetleri değerlendir.</p>
          <Link to="/ajans" className="mt-3 inline-flex rounded-xl border border-[#F5C542]/45 px-3 py-2 text-xs font-bold" style={{ color: AGENCY_GOLD }}>
            Ajans İşlemleri
          </Link>
        </div>
      ) : children}
    </div>
  );
}