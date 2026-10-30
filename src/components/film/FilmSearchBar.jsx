import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { SEARCH_MODES } from '@/lib/filmSearch';

/** Film arama kutusu: arama uygulama içinde yapılır, seçilen film uygulama içinde oynar. */
export default function FilmSearchBar({ onSearch, loading }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('title');
  const valid = text.trim().length >= 2;

  const submit = (event) => {
    event.preventDefault();
    if (!valid || loading) return;
    onSearch?.({ text: text.trim(), mode });
  };

  return (
    <section className="mx-auto w-full max-w-2xl px-4">
      <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-[#0b0d16]/90 p-4 shadow-[0_18px_50px_-24px_rgba(239,67,67,0.65)]">
        <div className="mb-3 flex items-center gap-1.5">
          {SEARCH_MODES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              aria-pressed={mode === item.key}
              className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
                mode === item.key
                  ? 'bg-[#ef4343] text-black'
                  : 'border border-white/12 bg-white/5 text-white/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/12 bg-black/50 px-3">
            <Search className="h-4 w-4 shrink-0 text-white/45" />
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              type="search"
              enterKeyHint="search"
              placeholder={mode === 'actor' ? 'Oyuncu adı yazın' : mode === 'genre' ? 'Tür yazın (korku, komedi…)' : 'Film adı yazın'}
              className="h-12 w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
            />
          </div>
          <button
            type="submit"
            disabled={!valid || loading}
            className="flex h-12 shrink-0 items-center gap-1.5 rounded-2xl px-4 text-sm font-black text-black disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#ffd9cf,#ef4343 60%,#b91c1c)' }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Ara
          </button>
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-snug text-white/45">
          <Search className="mt-[1px] h-3 w-3 shrink-0" />
          Arama uygulamanın içinde yapılır, seçtiğiniz film uygulamadan çıkmadan oynar.
        </p>
      </form>
    </section>
  );
}