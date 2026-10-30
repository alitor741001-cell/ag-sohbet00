import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clapperboard, Info, ShieldCheck } from 'lucide-react';
import FilmSearchBar from '@/components/film/FilmSearchBar';
import FilmPlayerPanel from '@/components/film/FilmPlayerPanel';
import LegalPlatformGrid from '@/components/film/LegalPlatformGrid';
import { openInBrowser } from '@/lib/filmSearch';

/** Film İzle: gerçek Google araması, yasal platformlar ve uygulama içi oynatıcı. */
export default function FilmWatch() {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="dark min-h-screen bg-[#05060c] pb-[calc(2rem+env(safe-area-inset-bottom))] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 15% 0%, rgba(239,67,67,0.22), transparent 55%), radial-gradient(circle at 85% 8%, rgba(56,189,248,0.13), transparent 52%)',
        }}
      />

      <header
        className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/10 bg-[#05060c]/90 px-3 py-3 backdrop-blur lg:top-16"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}
      >
        <button
          type="button"
          onClick={goBack}
          aria-label="Geri"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="flex items-center gap-2 text-base font-extrabold">
          <Clapperboard className="h-4 w-4 text-[#ef4343]" /> Film İzle
        </h1>
      </header>

      <div className="flex flex-col gap-5 pt-4">
        <FilmSearchBar onSearch={(url) => openInBrowser(url)} />
        <FilmPlayerPanel />
        <LegalPlatformGrid />

        <section className="mx-auto w-full max-w-2xl px-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b0d16]/80 p-4">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
              <Info className="h-3.5 w-3.5" /> Nasıl çalışır
            </h2>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-white/55">
              <li>• Arama kutusu Google'da gerçek sonuçları açar; uygulama film üretmez.</li>
              <li>• Film siteleri uygulama içinde gösterilmeyi engellediği için sonuçlar tarayıcıda açılır.</li>
              <li>• YouTube ve doğrudan video bağlantıları uygulamanın kendi oynatıcısında oynar.</li>
            </ul>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-[#8ef0b8]">
              <ShieldCheck className="mt-[1px] h-3.5 w-3.5 shrink-0" />
              Yalnızca yasal izleme platformlarını destekliyoruz.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}