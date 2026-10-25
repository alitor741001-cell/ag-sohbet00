import React from 'react';

/** Çarpan küresi bir nesnenin üstüne indiğinde o kareye inen şimşek: parlak flaş + yıldırım. */
export default function DedeStrike({ className = '', tone = 'red' }) {
  return (
    <span className={`dede-strike dede-strike-${tone === 'blue' ? 'blue' : 'red'} ${className}`} aria-hidden="true">
      <span className="dede-strike-flash" />
      <svg className="dede-strike-bolt" viewBox="0 0 24 44" aria-hidden="true">
        <path
          d="M13.6 0.6 L2.4 24.6 H9.6 L7.2 43.4 L21.6 18.6 H14.4 Z"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}