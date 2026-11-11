import '@/styles/gameAmbience.css';

// Yavaşça yükselen ışık parçacıkları: konum, gecikme ve süre sabit — her açılışta aynı ritim.
const SPARKS = [
  [6, 0, 9], [14, 3.5, 11], [23, 1.2, 8], [31, 6, 12], [40, 2.4, 10], [48, 7.5, 9],
  [57, 0.8, 11], [65, 4.6, 8], [73, 2, 12], [81, 6.8, 10], [89, 1.6, 9], [95, 5.2, 11],
];

/** Tüm oyunların üstünde duran hafif ışık katmanı: kenar parıltısı, akan ışık ve yükselen kıvılcımlar. */
export default function GameAmbience() {
  return (
    <div aria-hidden="true" className="game-ambience">
      <span className="game-ambience-edge" />
      <span className="game-ambience-sweep" />
      {SPARKS.map(([left, delay, duration]) => (
        <span
          key={left}
          className="game-ambience-spark"
          style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
        />
      ))}
    </div>
  );
}