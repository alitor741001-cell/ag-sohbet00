import React from 'react';
import { DEDE_SYMBOLS } from './dedeConfig';
import './dedeTray.css';

/** Sağ alt tepsi: üstte inen çarpanlar, altında patlayan nesneler ve adetleri birikir. */
export default function DedeTray({ symbols, orbs }) {
  return (
    <div className="dede-tray">
      <div className="dede-tray-mults">
        {orbs.map((value, index) => <span key={index} className="dede-tray-mult">+{value}x</span>)}
      </div>
      <div className="dede-tray-syms">
        {symbols.map(({ id, count }) => DEDE_SYMBOLS[id] && (
          <span key={id} className="dede-tray-sym">
            <img src={DEDE_SYMBOLS[id].art} alt={DEDE_SYMBOLS[id].name} draggable={false} />
            <b>{count}</b>
          </span>
        ))}
      </div>
    </div>
  );
}