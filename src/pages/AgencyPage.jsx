import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AgencySection from '@/components/agency/AgencySection';
import { AGENCY_GOLD } from '@/lib/agency';

/** Tam sayfa ajans merkezi: ajans başvurusu, davetler, yayıncı ve ajans panelleri. */
export default function AgencyPage() {
  const navigate = useNavigate();
  const { user, reload } = useCurrentUser();

  if (!user) return <div className="dark min-h-screen bg-transparent p-6 text-white">Yükleniyor...</div>;

  return (
    <div className="dark mx-auto min-h-screen max-w-3xl xl:max-w-4xl px-4 py-5 pb-24 text-foreground sm:px-6">
      <header className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Geri"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div><p className="text-[10px] font-bold uppercase tracking-widest text-primary">YÖNETİM MERKEZİ</p><h1 className="text-xl font-bold text-foreground">Ajans İşlemleri</h1></div>
      </header>
      <AgencySection user={user} onRefresh={reload} showHeading={false} />
    </div>
  );
}