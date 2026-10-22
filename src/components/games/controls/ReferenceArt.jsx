import React from 'react';
import { Image } from '@/components/ui/image';
import '@/components/games/controls/referenceControls.css';

const SOURCE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/87eb4141a_IMG_0096.jpg';
const CROPS = {
  stat0: [15, 60, 245, 132], stat1: [271, 60, 240, 132],
  stat2: [521, 60, 233, 132], stat3: [765, 60, 246, 132],
  session: [16, 213, 555, 165], coins: [584, 217, 425, 161],
  deck: [19, 396, 988, 200], pill: [108, 437, 359, 119],
  max: [489, 430, 125, 137], auto: [632, 432, 132, 140],
  spin: [781, 401, 205, 192],
};

/** Uploaded artwork, cropped without inventing replacement illustrations. */
export default function ReferenceArt({ name, className = '' }) {
  const [x, y, width, height] = CROPS[name] || CROPS.pill;
  return (
    <span aria-hidden="true" className={`ref-art ${className}`}>
      <Image src={SOURCE} alt="" fittingType="fit" quality={95} blurPlaceholder={false}
        className="ref-art-sheet"
        style={{ width: `${1023 / width * 100}%`, height: `${648 / height * 100}%`, left: `${-x / width * 100}%`, top: `${-y / height * 100}%` }} />
    </span>
  );
}