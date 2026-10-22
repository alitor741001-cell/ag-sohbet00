export default function GiftTransparencyFilter({ id }) {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0.3333 0.3333 0.3333 0 0" />
          <feComponentTransfer><feFuncA type="table" tableValues="0 0.95 1 1 1 1 1 1 1 1 1" /></feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}