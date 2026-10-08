import React from 'react';

/** Çarpan küresi bir nesnenin üstüne indiğinde o kareye inen şimşek: parlak flaş + yıldırım. */
export default function DedeStrike({ className = '' }) {
  return (
    <span className={`dede-strike ${className}`} aria-hidden="true">
      <span className="dede-strike-flash" />
      <svg className="dede-strike-bolt" viewBox="0 0 24 44" aria-hidden="true">
        <path
          d="M13.6 0.6 L2.4 24.6 H9.6 L7.2 43.4 L21.6 18.6 H14.4 Z"
          fill="#fff6cf"
          stroke="#ffffff"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}