import { ExternalLink, Play } from 'lucide-react';
import { openInBrowser } from '@/lib/filmSearch';

// Telif hakkına uygun platformlar. YouTube uygulama içinde oynar, Netflix kendi sitesinde açılır.
const PLATFORMS = [
  { name: 'Netflix', url: 'https://www.netflix.com/tr/', tone: 'from-[#e50914]/35 to-transparent', mark: 'N' },
  { name: 'YouTube', url: 'https://www.youtube.com/', tone: 'from-[#ff0033]/35 to-transparent', mark: '▶', inApp: true },
];

/** Yasal izleme platformları: YouTube uygulamanın içinde, Netflix kendi sitesinde açılır. */
export default function LegalPlatformGrid({ onYouTube }) {
  return (
    <section className="mx-auto w-full max-w-2xl px-4">
      <h2 className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/45">Yasal izleme platformları</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.name}
            type="button"
            onClick={() => (platform.inApp && onYouTube ? onYouTube() : openInBrowser(platform.url))}
            className={`group flex items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-br ${platform.tone} bg-[#0b0d16] px-3 py-3 text-left transition active:scale-95`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/50 text-xs font-black text-white">
              {platform.mark}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] font-extrabold text-white">{platform.name}</span>
            {platform.inApp ? (
              <Play className="h-3 w-3 shrink-0 text-white/35" />
            ) : (
              <ExternalLink className="h-3 w-3 shrink-0 text-white/35" />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}