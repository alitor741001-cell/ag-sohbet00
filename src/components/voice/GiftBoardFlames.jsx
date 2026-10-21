// Zenginlik panelinin alevli arka planı: alttan yükselen kor parçaları ve sallanan ateş ışığı.
const EMBERS = [
  { left: '6%', delay: '0s', duration: '2.8s', size: 5 },
  { left: '18%', delay: '0.6s', duration: '3.4s', size: 4 },
  { left: '31%', delay: '1.1s', duration: '2.6s', size: 6 },
  { left: '44%', delay: '0.3s', duration: '3.8s', size: 4 },
  { left: '58%', delay: '1.5s', duration: '3s', size: 5 },
  { left: '71%', delay: '0.9s', duration: '2.9s', size: 4 },
  { left: '84%', delay: '1.9s', duration: '3.6s', size: 6 },
  { left: '93%', delay: '0.2s', duration: '3.2s', size: 4 },
];

export default function GiftBoardFlames() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-32"
        style={{ background: 'radial-gradient(120% 100% at 50% 0%, rgba(239,68,68,0.4), transparent 72%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-52"
        style={{
          background: 'radial-gradient(120% 100% at 50% 100%, rgba(255,150,30,0.62), rgba(220,38,38,0.32) 42%, transparent 78%)',
          animation: 'wealth-fire-sway 4.5s ease-in-out infinite',
          transformOrigin: 'bottom center',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-28"
        style={{
          background: 'radial-gradient(90% 100% at 50% 100%, rgba(255,214,120,0.55), transparent 70%)',
          animation: 'wealth-fire-sway 3.2s ease-in-out infinite',
          transformOrigin: 'bottom center',
        }}
      />
      {EMBERS.map((ember, index) => (
        <span
          key={index}
          className="absolute bottom-2 rounded-full bg-[#ffb347]"
          style={{
            left: ember.left,
            height: ember.size,
            width: ember.size,
            boxShadow: '0 0 8px rgba(255,140,26,0.95)',
            animation: `wealth-flame-rise ${ember.duration} ease-out ${ember.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}