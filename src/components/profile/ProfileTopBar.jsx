/** Profil sayfasının üst şeridi: ortalanmış başlık. */
export default function ProfileTopBar({ title = 'Profil' }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="h-9 w-9" aria-hidden="true" />
      <h1 className="flex-1 text-center text-base font-bold text-[#f2ce6b]">{title}</h1>
      <span className="h-9 w-9" aria-hidden="true" />
    </div>
  );
}