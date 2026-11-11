import React from 'react';
import '@/components/games/controls/referenceControls.css';

export default function ReferenceChoiceButton({ children, className = '', ...props }) {
  return (
    <button type="button" className={`ref-choice ${className}`} {...props}>
      <span className="ref-choice-text">{children}</span>
    </button>
  );
}