import React from 'react';
import { Coins, Crown, Layers, Wallet } from 'lucide-react';
import FitGameText from '@/components/games/controls/FitGameText';
import '@/components/games/controls/referenceControls.css';

const FALLBACK = [Wallet, Layers, Crown, Coins];

/** Kazanç ve bakiye kartları: her biri kendi renginde parlayan cam kart; kazanç gelince kart nabız atar. */
export default function GameStatCards({ items }) {
  return (
    <div className="ref-stats">
      {items.map((item, index) => {
        const Icon = item.icon || FALLBACK[index % 4];
        return (
          <span key={item.key} className="ref-stat pc-glass" data-win={item.win ? '1' : undefined}>
            <span className="ref-stat-icon"><Icon strokeWidth={2.6} /></span>
            <span className="ref-stat-copy">
              <FitGameText as="strong">{item.key === 'win' ? 'WIN / KAZANÇ' : item.label}</FitGameText>
              <FitGameText as="b">{item.value}</FitGameText>
            </span>
          </span>
        );
      })}
    </div>
  );
}