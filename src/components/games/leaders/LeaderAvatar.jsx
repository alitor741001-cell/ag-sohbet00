import React from 'react';
import { Image } from '@/components/ui/image';

/** Yuvarlak kazanan fotoğrafı: fotoğraf yoksa ismin baş harfi görünür. */
export default function LeaderAvatar({ leader, className = '' }) {
  return (
    <span className={`relative block overflow-hidden rounded-full bg-[#3a0f52] ${className}`}>
      {leader?.avatar ? (
        <Image src={leader.avatar} alt={leader.name} className="absolute inset-0 h-full w-full" fittingType="fill" quality={70} />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[0.9em] font-black text-[#ffd76a]">
          {(leader?.name || '?').trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}