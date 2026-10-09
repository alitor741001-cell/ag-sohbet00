import * as THREE from 'three';

// Sahne ölçüleri (1 birim ≈ 1 metre).
export const TABLE_RADIUS = 1.92;
export const SEAT_RADIUS = 2.52;
export const HEAD_HEIGHT = 1.16;
export const HEAD_SIZE = 0.34;

// Oturan figürlerin ceket tonları: koyu takım elbiseler.
export const SUITS = [0x2a3350, 0x3a2b2c, 0x2b3a30, 0x353242, 0x45313b, 0x2c3541, 0x3d3a2b, 0x333d3c];

/** Koltuğun masa çevresindeki açısı: kendi koltuğum kameranın tam karşısına gelir. */
export function seatAngle(index, count, frontIndex) {
  const step = (Math.PI * 2) / Math.max(count, 1);
  return Math.PI / 2 + (index - frontIndex) * step;
}

export function seatPosition(index, count, frontIndex, radius = SEAT_RADIUS) {
  const angle = seatAngle(index, count, frontIndex);
  return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}

/** Seçilen koltuğun tam karşısına bakan kamera açısı. */
export function focusAzimuth(index, count, frontIndex) {
  return Math.PI / 2 - seatAngle(index, count, frontIndex);
}