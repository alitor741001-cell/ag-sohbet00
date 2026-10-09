/** Dizilim tuşlarının kart ikonu: SERİ DİZ üç sıralı kart, ÇİFT DİZ ikiz "5"li iki kart. */
export default function OkeyModeIcon({ variant }) {
  if (variant === 'cift') {
    return (
      <svg className="okey-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="1.8" y="5" width="9" height="14" rx="1.6" />
        <rect x="13.2" y="5" width="9" height="14" rx="1.6" />
        <text x="6.3" y="15.2" textAnchor="middle">5</text>
        <text x="17.7" y="15.2" textAnchor="middle">5</text>
      </svg>
    );
  }
  return (
    <svg className="okey-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.6" y="5.4" width="7.4" height="13.6" rx="1.6" />
      <rect x="8.3" y="3.4" width="7.4" height="13.6" rx="1.6" />
      <rect x="14" y="5.4" width="7.4" height="13.6" rx="1.6" />
    </svg>
  );
}