/** Süsleme amaçlı stilize ejderha başı. 'ice' buz mavisi, 'fire' alev tonundadır. */
export default function DragonHead({ className = '', variant = 'ice' }) {
  const id = `dragon-${variant}`;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {variant === 'fire' ? (
            <>
              <stop offset="0%" stopColor="#ffd36b" />
              <stop offset="45%" stopColor="#ff7a18" />
              <stop offset="100%" stopColor="#b91c1c" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#d6f7ff" />
              <stop offset="45%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0057d9" />
            </>
          )}
        </linearGradient>
      </defs>
      <path
        d="M60 6 46 16c-1-3-3-5-6-6 2 4 2 8 0 12-9-2-17 1-22 8l-8 2 7 4 1 7 6-3 4 8 3-8 7 1c9-1 15-7 18-16l9 4-4-9 6-4-6-2z"
        fill={`url(#${id})`}
      />
      <circle cx="41" cy="26" r="2.6" fill="#0b1220" />
      <path d="M20 40c6 2 12 1 17-2" stroke="#0b1220" strokeWidth="1.4" fill="none" opacity="0.45" />
    </svg>
  );
}