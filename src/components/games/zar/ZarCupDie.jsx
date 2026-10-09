import React from 'react';
import ZarDie from '@/components/games/zar/ZarDie';

/** Kase içindeki beyaz zar: üst yüz sonucu, iki yan yüz küp derinliğini gösterir. */
export default function ZarCupDie({ value }) {
  return (
    <span className="zar-cube" aria-label={`${value} zar`}>
      <span className="zar-cube-side zar-cube-left" aria-hidden="true"><i /><i /><i /></span>
      <span className="zar-cube-side zar-cube-right" aria-hidden="true"><i /><i /></span>
      <ZarDie value={value} tone="white" size="md" />
    </span>
  );
}