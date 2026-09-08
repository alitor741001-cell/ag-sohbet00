import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Loader2 } from 'lucide-react';

// Odaya girer girmez yukarıdan yavaşça iner; boş alana dokununca kapanır.
// Başka bir aksiyonda açılmaz — yalnızca oda girişinde gösterilir.
export default function RoomCatalogIntro() {
  const [open, setOpen] = useState(true);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Movie.filter({ published: true }, '-views', 60)
      .then(setMovies).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-black/30"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ y: '-105%' }}
            animate={{ y: 0 }}
            exit={{ y: '-105%' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 inset-x-0 z-[85] bg-card/95 backdrop-blur-xl border-b border-border rounded-b-2xl flex flex-col pt-[max(env(safe-area-inset-top),0.5rem)]"
            style={{ height: '38vh' }}
          >
            <div className="flex items-center justify-center pt-1.5 pb-1 shrink-0">
              <div className="w-10 h-1 bg-muted-foreground/40 rounded-full" />
            </div>
            <div className="flex items-center px-4 py-1.5 shrink-0">
              <h3 className="font-bold text-white flex items-center gap-2"><Film className="w-4 h-4 text-primary" /> Film Kataloğu</h3>
            </div>
            <div className="flex-1 min-h-0 overflow-x-auto no-scrollbar px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {loading ? <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> :
              !movies.length ? <p className="text-center text-sm text-muted-foreground py-8">Film bulunamadı.</p> :
              <div className="flex gap-3 h-full items-center">
                {movies.map((m) => (
                  <div key={m.id} className="shrink-0 w-24 rounded-xl overflow-hidden border-2 border-transparent">
                    <div className="w-24 h-32 relative">
                      {m.poster ? <Image src={m.poster} className="w-full h-full" fittingType="fill" /> : <div className="w-full h-full bg-secondary flex items-center justify-center text-xl font-bold">{(m.title || '?')[0]}</div>}
                    </div>
                    <div className="p-1.5 bg-card">
                      <p className="text-[11px] font-semibold truncate text-left">{m.title}</p>
                      {m.year && <p className="text-[9px] text-muted-foreground text-left">{m.year}</p>}
                    </div>
                  </div>
                ))}
              </div>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}