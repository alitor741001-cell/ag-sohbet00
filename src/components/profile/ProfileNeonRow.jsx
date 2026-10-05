import { ChevronRight } from 'lucide-react';

/**
 * Profil sayfasındaki neon menü satırı. Ton, çerçevenin ve ikonun rengini belirler;
 * açılır satırlarda ok aşağı döner.
 */
const TONES = {
  default: {
    border: 'rgba(255,255,255,0.16)',
    background: 'rgba(255,255,255,0.04)',
    boxShadow: 'none',
    icon: '#e5e7eb',
  },
  gold: {
    border: 'rgba(255,171,0,0.55)',
    background: 'linear-gradient(135deg, rgba(255,171,0,0.16), rgba(255,171,0,0.03))',
    boxShadow: '0 0 16px rgba(255,171,0,0.22)',
    icon: '#ffab00',
  },
  purple: {
    border: 'rgba(124,77,255,0.6)',
    background: 'linear-gradient(135deg, rgba(124,77,255,0.2), rgba(124,77,255,0.04))',
    boxShadow: '0 0 16px rgba(124,77,255,0.25)',
    icon: '#b39dff',
  },
  red: {
    border: 'rgba(255,82,82,0.5)',
    background: 'linear-gradient(135deg, rgba(255,45,45,0.14), rgba(255,45,45,0.03))',
    boxShadow: '0 0 16px rgba(255,45,45,0.18)',
    icon: '#ff5252',
  },
};

export default function ProfileNeonRow({ icon: Icon, title, subtitle, tone = 'default', open = false, onClick }) {
  const palette = TONES[tone] || TONES.default;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-transform active:scale-[0.98]"
      style={{ background: palette.background, border: `1px solid ${palette.border}`, boxShadow: palette.boxShadow }}
    >
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <Icon className="h-5 w-5" style={{ color: palette.icon }} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">{title}</span>
        {subtitle && <span className="block truncate text-[11px] text-white/55">{subtitle}</span>}
      </span>
      <ChevronRight className={`h-4 w-4 shrink-0 text-white/35 transition-transform ${open ? 'rotate-90' : ''}`} />
    </button>
  );
}