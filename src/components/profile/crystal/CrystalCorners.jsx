/** Referanstaki altın köşe çerçevesi: bilgi satırlarının dört köşesine oturan L parçaları. */
export default function CrystalCorners({ color = 'rgba(244,221,164,0.9)' }) {
  return (
    <>
      <span className="pointer-events-none absolute left-[-1px] top-[-1px] h-[7px] w-[7px] rounded-tl-[5px] border-l-[1.5px] border-t-[1.5px]" style={{ borderColor: color }} />
      <span className="pointer-events-none absolute right-[-1px] top-[-1px] h-[7px] w-[7px] rounded-tr-[5px] border-r-[1.5px] border-t-[1.5px]" style={{ borderColor: color }} />
      <span className="pointer-events-none absolute bottom-[-1px] left-[-1px] h-[7px] w-[7px] rounded-bl-[5px] border-b-[1.5px] border-l-[1.5px]" style={{ borderColor: color }} />
      <span className="pointer-events-none absolute bottom-[-1px] right-[-1px] h-[7px] w-[7px] rounded-br-[5px] border-b-[1.5px] border-r-[1.5px]" style={{ borderColor: color }} />
    </>
  );
}