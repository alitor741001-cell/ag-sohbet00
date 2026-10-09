import * as THREE from 'three';
import { HEAD_HEIGHT, SEAT_RADIUS, SUITS, TABLE_RADIUS, seatAngle, seatPosition } from './seatRing';

const BASE_SKIN = 0x6d4a38;
const leather = (tone) => new THREE.MeshStandardMaterial({ color: tone, roughness: 0.66, metalness: 0.14 });

/** Ceket: seçilince altın ışıltı verir. */
const suitMaterial = (tone) => {
  const material = new THREE.MeshStandardMaterial({ color: tone, roughness: 0.6, metalness: 0.18 });
  material.emissive = new THREE.Color(0xf2cd78);
  material.emissiveIntensity = 0;
  material.userData.tone = tone;
  return material;
};

/** 3D mafya odası: yuvarlak masa, sandalyeler, oturan figürler ve ışıklar. */
export function buildStage({ capacity, frontIndex }) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0810, 7, 17);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);

  // Oda: koyu silindir duvar ve zemin.
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9, 9, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0b0912, roughness: 1, metalness: 0, side: THREE.BackSide })
  );
  wall.position.y = 3.4;
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(8, 40),
    new THREE.MeshStandardMaterial({ color: 0x0d0b12, roughness: 1, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.62;
  scene.add(wall, floor);

  // Masa: koyu ahşap gövde, yeşil çuha üstü ve altın kenar.
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(TABLE_RADIUS, TABLE_RADIUS * 0.86, 0.22, 44),
    new THREE.MeshStandardMaterial({ color: 0x2f2018, roughness: 0.72, metalness: 0.2 })
  );
  body.position.y = -0.11;
  const felt = new THREE.Mesh(
    new THREE.CylinderGeometry(TABLE_RADIUS - 0.1, TABLE_RADIUS - 0.1, 0.03, 44),
    new THREE.MeshStandardMaterial({ color: 0x123a2c, roughness: 0.95 })
  );
  felt.position.y = 0.015;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(TABLE_RADIUS - 0.03, 0.03, 8, 64),
    new THREE.MeshStandardMaterial({ color: 0xc8a34e, roughness: 0.3, metalness: 0.9 })
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.025;
  scene.add(body, felt, rim);

  // Masa üstü: kart destesi, kadeh ve altın orta süsü.
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.05, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x8f1f2a, roughness: 0.55 })
  );
  deck.position.set(0.44, 0.04, 0.32);
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.05, 0.16, 16),
    new THREE.MeshStandardMaterial({ color: 0xdfe7f2, roughness: 0.16, metalness: 0.1, transparent: true, opacity: 0.45 })
  );
  glass.position.set(-0.52, 0.09, 0.24);
  const ornament = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.15, 0.24, 20),
    new THREE.MeshStandardMaterial({ color: 0xc8a34e, roughness: 0.34, metalness: 0.85 })
  );
  ornament.position.set(0, 0.14, -0.12);
  scene.add(deck, glass, ornament);

  // Işıklar: tepeden sıcak spot, iki yandan kırmızı ve mavi kenar ışığı.
  const ambient = new THREE.AmbientLight(0x596080, 0.5);
  const spot = new THREE.SpotLight(0xffd2a0, 2.4, 14, 0.95, 0.7, 1);
  spot.position.set(0, 5.4, 0.7);
  spot.target.position.set(0, 0, 0);
  const red = new THREE.PointLight(0xff3b30, 0.95, 12);
  red.position.set(-3.6, 1.8, -3.2);
  const blue = new THREE.PointLight(0x3b6fff, 0.8, 12);
  blue.position.set(3.6, 1.8, 3.2);
  scene.add(ambient, spot, spot.target, red, blue);

  // Koltuklar: sandalye + oturan figür. Yerel +Z masa merkezine bakar.
  const seats = [];
  for (let index = 0; index < capacity; index += 1) {
    const angle = seatAngle(index, capacity, frontIndex);
    const position = seatPosition(index, capacity, frontIndex);
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = Math.PI / 2 - angle;

    const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.1, 0.64), leather(0x1a1922));
    seatBase.position.set(0, 0.52, -0.06);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.8, 0.1), leather(0x1e1c28));
    back.position.set(0, 0.92, -0.42);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.5, 12), leather(0x14121a));
    post.position.set(0, 0.26, -0.06);

    const suit = suitMaterial(SUITS[index % SUITS.length]);
    const skin = new THREE.MeshStandardMaterial({ color: BASE_SKIN, roughness: 0.82 });
    skin.userData.tone = BASE_SKIN;

    const figure = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.28, 0.54, 18), suit);
    torso.position.set(0, 0.84, 0.02);
    const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), suit);
    shoulders.position.set(0, 1.06, 0.02);
    shoulders.scale.set(1, 0.62, 0.9);
    const armRight = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.44, 12), suit);
    armRight.position.set(0.25, 0.8, 0.18);
    armRight.rotation.set(1.28, 0, -0.22);
    const armLeft = armRight.clone();
    armLeft.position.x = -0.25;
    armLeft.rotation.z = 0.22;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), skin);
    head.position.set(0, HEAD_HEIGHT, 0.02);
    figure.add(torso, shoulders, armLeft, armRight, head);

    // Seçim jetonu: masanın kenarında, kişinin önünde parlar.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.38, 30),
      new THREE.MeshBasicMaterial({ color: 0xf2cd78, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.055, SEAT_RADIUS - TABLE_RADIUS + 0.06);
    ring.visible = false;

    group.add(seatBase, back, post, figure, ring);
    scene.add(group);

    seats.push({
      group,
      figure,
      ring,
      suit,
      skin,
      head: new THREE.Vector3(position.x, HEAD_HEIGHT, position.z),
      state: null,
    });
  }

  return { scene, camera, seats };
}