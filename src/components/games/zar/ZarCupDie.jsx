import React from 'react';
import ZarDie from '@/components/games/zar/ZarDie';

/** Kase içindeki zar: üst yüz takım renginde, iki yan yüz küp derinliğini gösterir. */
export default function ZarCupDie({ value, team }) {
  return (
    <span className={`zar-cube zar-cube-${team}`} aria-label={`${value} zar`}>
      <span className="zar-cube-side zar-cube-left" aria-hidden="true"><i /><i /><i /></span>
      <span className="zar-cube-side zar-cube-right" aria-hidden="true"><i /><i /></span>
      <ZarDie value={value} team={team} size="md" />
    </span>
  );
}