import { Link } from 'react-router-dom';
import { DoorOpen, MessageCircle, Mic, Play, Plus, Search, Users } from 'lucide-react';
import { openGoogle, openYouTube } from '@/lib/mediaSource';

// Film kataloğu kaldırıldı: ana sayfa hızlı bir başlangıç ekranıdır, veri çekmez.
export default function Home() {
  return (
    <div className="min-h-screen bg-catalog px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.18), rgba(153,27,27,0.06))', border: '1px solid rgba(239,68,68,0.22)' }}>
          <h1 className="text-2xl font-extrabold">FILMKEYFİ</h1>
          <p className="mt-1 text-sm text-white/60">Oda kur, arkadaşlarınla aynı ekranda buluş.</p>

          <Link
            to="/oda-kur"
            className="mt-5 flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white transition active:scale-95"
            style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
          >
            <Plus className="h-5 w-5" /> Oda Kur
          </Link>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link to="/acik-odalar" className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 py-3 text-sm font-semibold active:scale-95">
              <DoorOpen className="h-4 w-4" /> Odalar
            </Link>
            <Link to="/sesli-oda-kur" className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 py-3 text-sm font-semibold active:scale-95">
              <Mic className="h-4 w-4" /> Sesli Oda
            </Link>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-bold">Ekranı seç</p>
          <p className="mt-1 text-xs text-white/50">Google'da ara ya da YouTube videosunu odanda birlikte izle.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => openGoogle()} className="flex flex-col items-center gap-2 rounded-2xl border border-white/12 bg-black/40 py-4 transition active:scale-95">
              <Search className="h-6 w-6" />
              <span className="text-xs font-bold">Google</span>
            </button>
            <button type="button" onClick={() => openYouTube()} className="flex flex-col items-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/10 py-4 transition active:scale-95">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600"><Play className="h-3.5 w-3.5 fill-white text-white" /></span>
              <span className="text-xs font-bold">YouTube</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Link to="/arkadaslar" className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-3 text-[11px] font-semibold active:scale-95">
            <MessageCircle className="h-4 w-4" /> Arkadaşlar
          </Link>
          <Link to="/bildirimler" className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-3 text-[11px] font-semibold active:scale-95">
            <Users className="h-4 w-4" /> Bildirimler
          </Link>
          <Link to="/profil" className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-3 text-[11px] font-semibold active:scale-95">
            <DoorOpen className="h-4 w-4" /> Profil
          </Link>
        </div>
      </div>
    </div>
  );
}