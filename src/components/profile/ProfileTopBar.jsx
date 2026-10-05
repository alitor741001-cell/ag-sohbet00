import { ChevronLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Profil sayfasının üst şeridi: geri oku ve ortalanmış başlık. */
export default function ProfileTopBar({ title = 'Profil' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/'));

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <button
        type="button"
        onClick={goBack}
        aria-label="Geri"
        className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform active:scale-90"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <h1 className="flex-1 text-center text-base font-bold text-white">{title}</h1>
      <span className="h-9 w-9" aria-hidden="true" />
    </div>
  );
}