import React from 'react';
import ReferenceArt from '@/components/games/controls/ReferenceArt';

export default function ReferenceChoiceButton({ children, className = '', ...props }) {
  return (
    <button type="button" className={`ref-choice ${className}`} {...props}>
      <ReferenceArt name="pill" />
      <span className="ref-choice-text">{children}</span>
    </button>
  );
}