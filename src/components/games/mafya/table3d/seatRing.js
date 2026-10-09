import * as THREE from 'three';

// Sahne ölçüleri: masa küçük, yüzler büyük — telefon ekranında herkes okunur kalır.
export const HEAD_HEIGHT = 0.96;
export const HEAD_SIZE = 0.42;
export const TABLE_INSET = 0.36;

// Oturan figürlerin ceket tonları: koyu takım elbiseler.
export const SUITS = [0x2a3350, 0x3a2b2c, 0x2b3a30, 0x353242, 0x45313b, 0x2c3541, 0x3d3a2b, 0x333d3c];

/** Masa, oyuncu sayısına göre büyür: az oyunculu masada yüzler daha da büyük görünür. */
export function seatRadius(capacity) {
  return 0.55 + 0.105 * Math.max(4, Math.min(8, capacity));
}

export function tableRadius(capacity) {
  return seatRadius(capacity) - TABLE_INSET;
}

/** Koltuğun masa çevresindeki açısı: kendi koltuğum kameranın tam karşısına gelir. */
export function seatAngle(index, count, frontIndex) {
  const step = (Math.PI * 2) / Math.max(count, 1);
  return Math.PI / 2 + (index - frontIndex) * step;
}

export function seatPosition(index, count, frontIndex, radius = seatRadius(count)) {
  const angle = seatAngle(index, count, frontIndex);
  return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}

/** Seçilen koltuğun tam karşısına bakan kamera açısı. */
export function focusAzimuth(index, count, frontIndex) {
  return Math.PI / 2 - seatAngle(index, count, frontIndex);
}