import * as THREE from 'three';
import { HEAD_HEIGHT, SUITS, TABLE_INSET, seatAngle, seatPosition, seatRadius, tableRadius } from './seatRing';

const BASE_SKIN = 0x7a5340;
const leather = (tone) => new THREE.MeshStandardMaterial({ color: tone, roughness: 0.66, metalness: 0.14 });

/** Ceket: seçilince altın ışıltı verir. */
const suitMaterial = (tone) => {
  const material = new THREE.MeshStandardMaterial({ color: tone, roughness: 0.6, metalness: 0.18 });
  material.emissive = new THREE.Color(0xf2cd78);
  material.emissiveIntensity = 0;
  material.userData.tone = tone;
  return material;
};

const neon = (tone) => {
  const material = new THREE.MeshStandardMaterial({ color: 0x120305, roughness: 0.5, metalness: 0.2 });
  material.emissive = new THREE.Color(tone);
  material.emissiveIntensity = 1.5;
  return material;
};

/** 3D mafya odası: yuvarlak masa, sandalyeler, oturan figürler, tavan lambası ve ışıklar. */
export function buildStage({ capacity, frontIndex }) {
  const TABLE_RADIUS = tableRadius(capacity);
  const SEAT_RADIUS = seatRadius(capacity);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0810, 8, 19);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 70);

  // Oda: koyu silindir duvar, zemin ve arka duvarda neon şeritler.
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(7.5, 7.5, 8, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0a0810, roughness: 1, metalness: 0, side: THREE.BackSide })
  );
  wall.position.y = 3.2;
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7.2, 40),
    new THREE.MeshStandardMaterial({ color: 0x0c0a11, roughness: 1, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.5;
  scene.add(wall, floor);

  [0.7, 2.5, 4.3].forEach((angle, index) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.9, 0.03), neon(index === 1 ? 0xd4af37 : 0xcc0018));
    strip.position.set(Math.cos(angle) * 7.3, 1.9, Math.sin(angle) * 7.3);
    strip.rotation.y = Math.PI / 2 - angle;
    scene.add(strip);
  });

  // Tavandan sarkan lamba: ışığın kaynağı görünür.
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 1.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1f, roughness: 0.8 })
  );
  wire.position.y = 4.15;
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.44, 0.32, 22, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x15131b, roughness: 0.5, metalness: 0.35, side: THREE.DoubleSide })
  );
  shade.position.y = 3.42;
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.3, 22), new THREE.MeshBasicMaterial({ color: 0xffd9a8 }));
  bulb.rotation.x = Math.PI / 2;
  bulb.position.y = 3.27;
  scene.add(wire, shade, bulb);

  // Masa: koyu ahşap gövde, yeşil çuha üstü ve altın kenar.
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(TABLE_RADIUS, TABLE_RADIUS * 0.86, 0.2, 40),
    new THREE.MeshStandardMaterial({ color: 0x2f2018, roughness: 0.72, metalness: 0.2 })
  );
  body.position.y = -0.1;
  const felt = new THREE.Mesh(
    new THREE.CylinderGeometry(TABLE_RADIUS - 0.08, TABLE_RADIUS - 0.08, 0.03, 40),
    new THREE.MeshStandardMaterial({ color: 0x123a2c, roughness: 0.95 })
  );
  felt.position.y = 0.015;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(TABLE_RADIUS - 0.02, 0.025, 8, 56),
    new THREE.MeshStandardMaterial({ color: 0xc8a34e, roughness: 0.3, metalness: 0.9 })
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.025;
  scene.add(body, felt, rim);

  // Masa üstü: kart destesi, kadeh ve altın orta süsü.
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.04, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x8f1f2a, roughness: 0.55 })
  );
  deck.position.set(0.32, 0.03, 0.24);
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.04, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0xdfe7f2, roughness: 0.16, metalness: 0.1, transparent: true, opacity: 0.45 })
  );
  glass.position.set(-0.36, 0.08, 0.18);
  const ornament = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.11, 0.17, 20),
    new THREE.MeshStandardMaterial({ color: 0xc8a34e, roughness: 0.34, metalness: 0.85 })
  );
  ornament.position.set(0, 0.1, -0.08);
  scene.add(deck, glass, ornament);

  // Işıklar: tepeden sıcak spot, iki yandan kırmızı ve mavi kenar ışığı.
  const ambient = new THREE.AmbientLight(0x596080, 0.5);
  const spot = new THREE.SpotLight(0xffd2a0, 2.8, 9, 0.8, 0.65, 1);
  spot.position.set(0, 3.35, 0.4);
  spot.target.position.set(0, 0, 0);
  const red = new THREE.PointLight(0xff3b30, 0.9, 8);
  red.position.set(-2.4, 1.4, -2.2);
  const blue = new THREE.PointLight(0x3b6fff, 0.8, 8);
  blue.position.set(2.4, 1.4, 2.2);
  scene.add(ambient, spot, spot.target, red, blue);

  // Koltuklar: sandalye + oturan figür. Yerel +Z masa merkezine bakar.
  const seats = [];
  for (let index = 0; index < capacity; index += 1) {
    const angle = seatAngle(index, capacity, frontIndex);
    const position = seatPosition(index, capacity, frontIndex);
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = Math.PI / 2 - angle;

    const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.46), leather(0x1a1922));
    seatBase.position.set(0, 0.44, -0.06);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.08), leather(0x1e1c28));
    back.position.set(0, 0.74, -0.32);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.42, 12), leather(0x14121a));
    post.position.set(0, 0.22, -0.06);

    const suit = suitMaterial(SUITS[index % SUITS.length]);
    const skin = new THREE.MeshStandardMaterial({ color: BASE_SKIN, roughness: 0.82 });
    skin.userData.tone = BASE_SKIN;

    const figure = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.44, 16), suit);
    torso.position.set(0, 0.68, 0.02);
    const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), suit);
    shoulders.position.set(0, 0.86, 0.02);
    shoulders.scale.set(1, 0.62, 0.9);
    const armRight = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.36, 10), suit);
    armRight.position.set(0.2, 0.66, 0.16);
    armRight.rotation.set(1.28, 0, -0.22);
    const armLeft = armRight.clone();
    armLeft.position.x = -0.2;
    armLeft.rotation.z = 0.22;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), skin);
    head.position.set(0, HEAD_HEIGHT, 0.02);
    figure.add(torso, shoulders, armLeft, armRight, head);

    // Seçim jetonu: masanın kenarında, kişinin önünde parlar.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.31, 30),
      new THREE.MeshBasicMaterial({ color: 0xf2cd78, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.05, TABLE_INSET + 0.02);
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