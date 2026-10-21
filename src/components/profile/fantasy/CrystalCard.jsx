/** Profil sayfalarının mavi kristal kartı: ışıklı ince kenar ve koyu lacivert gövde. */
export default function CrystalCard({ children, className = '' }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(9,30,64,0.92), rgba(4,14,32,0.94))',
        border: '1px solid rgba(125,211,252,0.32)',
        boxShadow: 'inset 0 0 26px rgba(56,189,248,0.14)',
      }}
    >
      {children}
    </div>
  );
}