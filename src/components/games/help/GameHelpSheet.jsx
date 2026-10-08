import React from 'react';
import { X } from 'lucide-react';
import useBackDismiss from '@/hooks/useBackDismiss';
import { helpFor } from './gameHelpContent';
import HelpSymbolGrid from './HelpSymbolGrid';
import '@/styles/gameHelp.css';

/** Nasıl oynanır: her oyunun kurallarını ve kademelerini gösteren ortak alt panel. */
export default function GameHelpSheet({ game, open, onClose }) {
  useBackDismiss(open, onClose);
  const help = helpFor(game);
  if (!open || !help) return null;

  return (
    <div className="gh-sheet">
      <button type="button" aria-label="Kapat" onClick={onClose} className="gh-veil" />
      <div className="gh-body">
        <header className="gh-head">
          <span className="gh-brand">
            <p className="gh-title">{help.title}</p>
            <p className="gh-tagline">{help.tagline}</p>
          </span>
          <button type="button" onClick={onClose} aria-label="Kapat" className="gh-close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <p className="gh-section">NASIL OYNANIR</p>
        <ol className="gh-list">{help.rules.map((line) => <li key={line}>{line}</li>)}</ol>

        {help.legend && (
          <>
            <p className="gh-section">TAŞLAR VE NE YAPAR</p>
            <HelpSymbolGrid legend={help.legend} />
          </>
        )}

        {help.facts?.length > 0 && (
          <>
            <p className="gh-section">ÖZELLİKLER</p>
            <ul className="gh-list gh-list-dot">{help.facts.map((line) => <li key={line}>{line}</li>)}</ul>
          </>
        )}

        <p className="gh-note">{help.note}</p>
      </div>
    </div>
  );
}