/** Ateş-buz çerçevesi: köşe filigranları ve kenar pimleriyle sarmalanmış panel. */
export default function FireFrame({ children, className = '', innerClassName = '', glow = true, ornate = true }) {
  return (
    <div className={`fi-frame ${glow ? 'fi-glow' : ''} ${className}`}>
      {ornate && (
        <>
          <span className="fi-corner left-[-5px] top-[-5px]" aria-hidden="true" />
          <span className="fi-corner right-[-5px] top-[-5px]" aria-hidden="true" />
          <span className="fi-corner bottom-[-5px] left-[-5px]" aria-hidden="true" />
          <span className="fi-corner bottom-[-5px] right-[-5px]" aria-hidden="true" />
          <span className="fi-pin fi-pin-top" aria-hidden="true" />
          <span className="fi-pin fi-pin-bottom" aria-hidden="true" />
        </>
      )}
      <div className={innerClassName}>{children}</div>
    </div>
  );
}