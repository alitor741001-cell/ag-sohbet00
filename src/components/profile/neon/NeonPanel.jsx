/** Metalik çift çerçeveli panel: köşelerinde eğik altın–turkuaz çiviler vardır. */
export default function NeonPanel({ children, className = '', innerClassName = '' }) {
  return (
    <div className={`neon-panel ${className}`}>
      <div className={`neon-panel-inner ${innerClassName}`}>{children}</div>
      <span className="neon-corner left-[-3px] top-[-3px]" aria-hidden="true" />
      <span className="neon-corner right-[-3px] top-[-3px]" aria-hidden="true" />
      <span className="neon-corner bottom-[-3px] left-[-3px]" aria-hidden="true" />
      <span className="neon-corner bottom-[-3px] right-[-3px]" aria-hidden="true" />
    </div>
  );
}