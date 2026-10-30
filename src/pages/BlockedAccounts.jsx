import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BlockedUsers from '@/components/profile/BlockedUsers';

/** Engellenen Hesaplar: ayarların içinden tam sayfa olarak açılır, geri düğmesiyle kapanır. */
export default function BlockedAccounts() {
  const navigate = useNavigate();

  return (
    <div className="dark min-h-screen text-white">
      <div className="mx-auto w-full max-w-2xl px-4 pt-3 md:max-w-3xl xl:max-w-4xl">
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/profil/ayarlar')}
            aria-label="Geri"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-white">Engellenen Hesaplar</h1>
            <p className="text-[11px] font-semibold text-white/45">Engellediğin üyeler burada listelenir</p>
          </div>
        </div>

        <div className="pb-10">
          <BlockedUsers />
        </div>
      </div>
    </div>
  );
}