/**
 * Canlı yayın rozeti: profil fotoğrafının alt kenarına ortalanan pembe-turuncu şerit.
 * Yalnızca kişi yayındayken gösterilir.
 */
export default function LiveBadge() {
  return (
    <span
      className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full px-1.5 py-[1px] text-[8px] font-black uppercase leading-none tracking-tight text-white shadow-[0_1px_5px_rgba(0,0,0,0.55)]"
      style={{ background: 'linear-gradient(90deg, #ec4899, #f97316)' }}
    >
      LIVE
    </span>
  );
}