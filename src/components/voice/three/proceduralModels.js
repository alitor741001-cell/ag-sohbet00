import * as THREE from 'three';

// Hediye başına gerçek zamanlı üretilen 3D geometri.
// Gerçek GLB/GLTF dosyası yüklenmediğinde önizlemede bunlar döner; resim değil,
// tarayıcıda çizilen gerçek 3D nesnelerdir (bkz. Gift3DViewer).

const skin = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.2, ...extra });

const add = (group, mesh, position = [0, 0, 0], rotation) => {
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  group.add(mesh);
  return mesh;
};

const box = (group, w, h, d, color, position, rotation, extra) =>
  add(group, new THREE.Mesh(new THREE.BoxGeometry(w, h, d), skin(color, extra)), position, rotation);
const ball = (group, radius, color, position, extra) =>
  add(group, new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 20), skin(color, extra)), position);
const tube = (group, top, bottom, height, color, position, rotation, extra) =>
  add(group, new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 28), skin(color, extra)), position, rotation);
const spike = (group, radius, height, color, position, rotation, extra) =>
  add(group, new THREE.Mesh(new THREE.ConeGeometry(radius, height, 28), skin(color, extra)), position, rotation);
const hoop = (group, radius, width, color, position, rotation, extra) =>
  add(group, new THREE.Mesh(new THREE.TorusGeometry(radius, width, 18, 48), skin(color, extra)), position, rotation);

const heartGeometry = () => {
  const shape = new THREE.Shape();
  shape.moveTo(0, -1.15);
  shape.bezierCurveTo(1.5, -0.2, 1.18, 1.25, 0, 0.62);
  shape.bezierCurveTo(-1.18, 1.25, -1.5, -0.2, 0, -1.15);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.5, bevelEnabled: true, bevelSegments: 6, bevelSize: 0.12, bevelThickness: 0.12, curveSegments: 28,
  });
  geometry.center();
  return geometry;
};

const starGeometry = () => {
  const shape = new THREE.Shape();
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? 1.15 : 0.48;
    const angle = (Math.PI / 5) * index - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.36, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 4 });
  geometry.center();
  return geometry;
};

const BUILDERS = {
  heart: () => {
    const group = new THREE.Group();
    add(group, new THREE.Mesh(heartGeometry(), skin('#ef2d56', { roughness: 0.18, metalness: 0.35 })));
    return group;
  },

  rose: () => {
    const group = new THREE.Group();
    tube(group, 0.06, 0.07, 1.8, '#2f7d32', [0, -0.7, 0]);
    spike(group, 0.3, 0.7, '#3f9a45', [0.3, -0.75, 0], [0, 0, -1.1]);
    [0, 1, 2, 3, 4].forEach((index) => {
      const angle = (index / 5) * Math.PI * 2;
      ball(group, 0.34, '#d81b45', [Math.cos(angle) * 0.26, 0.45 + Math.sin(angle) * 0.12, Math.sin(angle) * 0.26]);
    });
    ball(group, 0.42, '#f43f6b', [0, 0.62, 0], { roughness: 0.25 });
    return group;
  },

  bouquet: () => {
    const group = new THREE.Group();
    const colors = ['#f43f6b', '#f9a8d4', '#fbbf24', '#a78bfa', '#fb7185'];
    colors.forEach((color, index) => {
      const angle = (index / colors.length) * Math.PI * 2;
      const x = Math.cos(angle) * 0.55;
      const z = Math.sin(angle) * 0.55;
      tube(group, 0.035, 0.035, 1.5, '#2f7d32', [x * 0.6, -0.45, z * 0.6], [0.22 * Math.cos(angle), 0, -0.22 * Math.sin(angle)]);
      ball(group, 0.24, color, [x, 0.42, z]);
      hoop(group, 0.27, 0.06, color, [x, 0.42, z], [Math.PI / 2, 0, 0]);
    });
    ball(group, 0.26, '#fde68a', [0, 0.5, 0]);
    return group;
  },

  ring: () => {
    const group = new THREE.Group();
    hoop(group, 0.78, 0.15, '#f5c542', [0, -0.1, 0], [Math.PI / 2, 0, 0], { metalness: 0.9, roughness: 0.15 });
    add(group, new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), skin('#bfe9ff', { metalness: 0.7, roughness: 0.08, flatShading: true })), [0, 0.95, 0]);
    return group;
  },

  bear: () => {
    const group = new THREE.Group();
    const fur = '#a86b3c';
    ball(group, 0.78, fur, [0, -0.35, 0]);
    ball(group, 0.56, fur, [0, 0.6, 0]);
    ball(group, 0.2, fur, [-0.4, 1.02, 0]);
    ball(group, 0.2, fur, [0.4, 1.02, 0]);
    ball(group, 0.26, '#e8c9a0', [0, 0.48, 0.42]);
    ball(group, 0.09, '#241a12', [-0.18, 0.68, 0.5]);
    ball(group, 0.09, '#241a12', [0.18, 0.68, 0.5]);
    ball(group, 0.26, fur, [-0.72, -0.2, 0]);
    ball(group, 0.26, fur, [0.72, -0.2, 0]);
    return group;
  },

  car: () => {
    const group = new THREE.Group();
    box(group, 2.2, 0.52, 0.95, '#e11d48', [0, -0.1, 0]);
    box(group, 1.1, 0.42, 0.82, '#9f1239', [-0.1, 0.35, 0]);
    box(group, 1.0, 0.26, 0.7, '#93e6ff', [-0.1, 0.38, 0], null, { metalness: 0.6, roughness: 0.1 });
    [-0.72, 0.72].forEach((x) => {
      [-0.48, 0.48].forEach((z) => {
        tube(group, 0.28, 0.28, 0.18, '#0f172a', [x, -0.34, z], [Math.PI / 2, 0, 0]);
      });
    });
    ball(group, 0.1, '#fde68a', [1.1, 0.05, 0.28], { emissive: new THREE.Color('#fde68a'), emissiveIntensity: 1 });
    ball(group, 0.1, '#fde68a', [1.1, 0.05, -0.28], { emissive: new THREE.Color('#fde68a'), emissiveIntensity: 1 });
    return group;
  },

  diamond: () => {
    const group = new THREE.Group();
    add(group, new THREE.Mesh(new THREE.OctahedronGeometry(1.05, 0), skin('#9be7ff', { metalness: 0.85, roughness: 0.05, flatShading: true })));
    hoop(group, 1.02, 0.05, '#e0f2fe', [0, 0.05, 0], [Math.PI / 2, 0, 0], { metalness: 0.9, roughness: 0.1 });
    return group;
  },

  castle: () => {
    const group = new THREE.Group();
    box(group, 2.0, 0.9, 1.4, '#8f9bb3', [0, -0.45, 0]);
    [-0.85, 0, 0.85].forEach((x, index) => {
      tube(group, 0.34, 0.4, index === 1 ? 1.5 : 1.15, '#aab6cc', [x, 0.3, 0]);
      spike(group, 0.46, 0.72, '#7c3aed', [x, index === 1 ? 1.4 : 1.2, 0]);
    });
    box(group, 0.5, 0.62, 0.1, '#3b2a12', [0, -0.6, 0.72]);
    ball(group, 0.08, '#fde68a', [0.85, 0.4, 0.4], { emissive: new THREE.Color('#fde68a'), emissiveIntensity: 1.4 });
    ball(group, 0.08, '#fde68a', [-0.85, 0.4, 0.4], { emissive: new THREE.Color('#fde68a'), emissiveIntensity: 1.4 });
    return group;
  },

  crown: () => {
    const group = new THREE.Group();
    tube(group, 0.85, 0.8, 0.5, '#f5c542', [0, -0.25, 0], null, { metalness: 0.95, roughness: 0.18, side: THREE.DoubleSide });
    [0, 1, 2, 3, 4, 5].forEach((index) => {
      const angle = (index / 6) * Math.PI * 2;
      spike(group, 0.14, 0.6, '#f5c542', [Math.cos(angle) * 0.8, 0.3, Math.sin(angle) * 0.8], [0, 0, 0], { metalness: 0.95, roughness: 0.18 });
      ball(group, 0.09, '#e11d48', [Math.cos(angle) * 0.8, 0.62, Math.sin(angle) * 0.8]);
    });
    return group;
  },

  rocket: () => {
    const group = new THREE.Group();
    tube(group, 0.42, 0.48, 1.9, '#e2e8f0', [0, 0, 0], null, { metalness: 0.6, roughness: 0.25 });
    spike(group, 0.42, 0.8, '#ef4444', [0, 1.28, 0]);
    [-1, 1].forEach((side) => {
      box(group, 0.5, 0.7, 0.08, '#ef4444', [side * 0.5, -0.55, 0], [0, 0, side * 0.35]);
    });
    ball(group, 0.22, '#93e6ff', [0, 0.42, 0.36], { metalness: 0.7, roughness: 0.1 });
    spike(group, 0.26, 0.85, '#fb923c', [0, -1.28, 0], [Math.PI, 0, 0], { emissive: new THREE.Color('#fb923c'), emissiveIntensity: 1.1 });
    return group;
  },

  galaxy: () => {
    const group = new THREE.Group();
    const count = 2600;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = Math.pow(Math.random(), 0.6) * 1.7;
      const arm = (index % 3) * ((Math.PI * 2) / 3);
      const angle = arm + radius * 2.6 + Math.random() * 0.5;
      positions[index * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.22;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 0.28;
      positions[index * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.22;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#c4b5fd', size: 0.05, transparent: true, opacity: 0.95 })));
    ball(group, 0.3, '#fdf4ff', [0, 0, 0], { emissive: new THREE.Color('#f0abfc'), emissiveIntensity: 1.6 });
    return group;
  },

  giftbox: () => {
    const group = new THREE.Group();
    box(group, 1.6, 1.3, 1.6, '#e11d48', [0, -0.1, 0]);
    box(group, 1.7, 0.26, 0.34, '#facc15', [0, -0.1, 0]);
    box(group, 0.34, 0.26, 1.7, '#facc15', [0, -0.1, 0]);
    hoop(group, 0.28, 0.09, '#facc15', [-0.3, 0.62, 0], [0, 0, 0.5]);
    hoop(group, 0.28, 0.09, '#facc15', [0.3, 0.62, 0], [0, 0, -0.5]);
    return group;
  },

  chocolate: () => {
    const group = new THREE.Group();
    box(group, 1.9, 0.24, 1.4, '#7c2d12', [0, -0.12, 0]);
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        box(group, 0.44, 0.34, 0.44, '#4b2410', [-0.62 + column * 0.62, 0.05, -0.34 + row * 0.68], null, { roughness: 0.5 });
      }
    }
    return group;
  },

  letter: () => {
    const group = new THREE.Group();
    box(group, 1.7, 0.1, 1.2, '#fef3c7', [0, -0.05, 0]);
    box(group, 1.7, 0.34, 0.12, '#fcd34d', [0, 0.16, 0]);
    add(group, new THREE.Mesh(heartGeometry(), skin('#e11d48')), [0, 0.1, 0.1]);
    ball(group, 0.16, '#b91c1c', [0.6, 0.06, 0.5]);
    return group;
  },

  cake: () => {
    const group = new THREE.Group();
    tube(group, 0.95, 1.0, 0.55, '#fbcfe8', [0, -0.55, 0]);
    tube(group, 0.72, 0.78, 0.45, '#f9a8d4', [0, -0.1, 0]);
    [0, 1, 2, 3, 4].forEach((index) => {
      const angle = (index / 5) * Math.PI * 2;
      const x = Math.cos(angle) * 0.4;
      const z = Math.sin(angle) * 0.4;
      tube(group, 0.045, 0.045, 0.5, '#fef9c3', [x, 0.35, z]);
      spike(group, 0.07, 0.22, '#fb923c', [x, 0.7, z], null, { emissive: new THREE.Color('#fb923c'), emissiveIntensity: 1.2 });
    });
    return group;
  },

  star: () => {
    const group = new THREE.Group();
    add(group, new THREE.Mesh(starGeometry(), skin('#fde047', { metalness: 0.6, roughness: 0.2, emissive: new THREE.Color('#facc15'), emissiveIntensity: 0.4 })));
    return group;
  },

  trophy: () => {
    const group = new THREE.Group();
    tube(group, 0.62, 0.34, 0.8, '#f5c542', [0, 0.3, 0], null, { metalness: 0.95, roughness: 0.16 });
    tube(group, 0.14, 0.14, 0.5, '#f5c542', [0, -0.28, 0], null, { metalness: 0.95, roughness: 0.16 });
    tube(group, 0.46, 0.5, 0.2, '#b45309', [0, -0.62, 0]);
    hoop(group, 0.26, 0.06, '#f5c542', [-0.62, 0.42, 0], [0, 0, 0.4], { metalness: 0.95, roughness: 0.16 });
    hoop(group, 0.26, 0.06, '#f5c542', [0.62, 0.42, 0], [0, 0, -0.4], { metalness: 0.95, roughness: 0.16 });
    return group;
  },

  fireworks: () => {
    const group = new THREE.Group();
    const count = 420;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.8 + Math.random() * 0.9;
      positions[index * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[index * 3 + 1] = Math.cos(phi) * radius;
      positions[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#fde047', size: 0.07, transparent: true, opacity: 0.9 })));
    ball(group, 0.2, '#fb923c', [0, 0, 0], { emissive: new THREE.Color('#fb923c'), emissiveIntensity: 1.6 });
    return group;
  },

  jet: () => {
    const group = new THREE.Group();
    tube(group, 0.26, 0.32, 2.4, '#e2e8f0', [0, 0, 0], [0, 0, Math.PI / 2], { metalness: 0.7, roughness: 0.2 });
    spike(group, 0.3, 0.6, '#cbd5e1', [1.5, 0, 0], [0, 0, -Math.PI / 2]);
    box(group, 0.5, 0.1, 1.9, '#cbd5e1', [-0.1, -0.06, 0]);
    box(group, 0.4, 0.5, 0.1, '#94a3b8', [-1.1, 0.28, 0]);
    box(group, 0.3, 0.08, 0.8, '#94a3b8', [-1.15, 0, 0]);
    return group;
  },

  yacht: () => {
    const group = new THREE.Group();
    box(group, 2.2, 0.42, 0.8, '#f8fafc', [0, -0.32, 0], null, { roughness: 0.2 });
    spike(group, 0.42, 0.7, '#e2e8f0', [1.35, -0.32, 0], [0, 0, -Math.PI / 2]);
    box(group, 0.8, 0.4, 0.6, '#e2e8f0', [-0.35, 0.02, 0]);
    tube(group, 0.035, 0.035, 1.5, '#94a3b8', [-0.1, 0.75, 0]);
    box(group, 0.06, 0.8, 0.7, '#fef9c3', [-0.1, 0.85, 0]);
    return group;
  },

  island: () => {
    const group = new THREE.Group();
    hoop(group, 1.5, 0.32, '#38bdf8', [0, -0.6, 0], [Math.PI / 2, 0, 0], { transparent: true, opacity: 0.75 });
    spike(group, 0.95, 0.8, '#fcd34d', [0, -0.4, 0], [Math.PI, 0, 0]);
    tube(group, 0.08, 0.12, 1.1, '#a16207', [0.3, 0.35, 0], [0, 0, -0.14]);
    [0, 1, 2, 3, 4].forEach((index) => {
      const angle = (index / 5) * Math.PI * 2;
      spike(group, 0.2, 0.7, '#22c55e', [0.3 + Math.cos(angle) * 0.28, 1.0, Math.sin(angle) * 0.28], [Math.cos(angle) * 0.9, 0, Math.sin(angle) * 0.9]);
    });
    return group;
  },

  butterfly: () => {
    const group = new THREE.Group();
    tube(group, 0.06, 0.06, 1.1, '#312e81', [0, 0, 0]);
    [-1, 1].forEach((side) => {
      ball(group, 0.44, '#a855f7', [side * 0.5, 0.3, 0]).scale.set(1.1, 1, 0.28);
      ball(group, 0.32, '#f472b6', [side * 0.42, -0.35, 0]).scale.set(1.1, 1, 0.28);
    });
    return group;
  },

  watch: () => {
    const group = new THREE.Group();
    tube(group, 0.62, 0.62, 0.28, '#0f172a', [0, 0, 0], [Math.PI / 2, 0, 0], { metalness: 0.7 });
    hoop(group, 0.62, 0.1, '#f5c542', [0, 0, 0.16], [0, 0, 0], { metalness: 0.95, roughness: 0.15 });
    box(group, 0.34, 1.4, 0.16, '#f5c542', [0, 0.85, 0], null, { metalness: 0.95, roughness: 0.2 });
    box(group, 0.34, 1.4, 0.16, '#f5c542', [0, -0.85, 0], null, { metalness: 0.95, roughness: 0.2 });
    return group;
  },

  ingot: () => {
    const group = new THREE.Group();
    tube(group, 0.55, 0.75, 0.6, '#f5c542', [0, 0, 0], [0, 0, 0], { metalness: 0.95, roughness: 0.14 });
    add(group, new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 0.6, 4), skin('#f5c542', { metalness: 0.95, roughness: 0.14 })), [0.6, -0.55, 0.5], [0, 0.4, 0]);
    return group;
  },

  wand: () => {
    const group = new THREE.Group();
    tube(group, 0.06, 0.06, 1.9, '#7c3aed', [0, -0.4, 0], [0, 0, 0.1]);
    add(group, new THREE.Mesh(starGeometry(), skin('#fde047', { emissive: new THREE.Color('#facc15'), emissiveIntensity: 0.9 })), [0.1, 0.85, 0]).scale.setScalar(0.42);
    return group;
  },
};

/** Hediye türüne göre 3D nesne üretir (temsili 3D geometri). */
export function buildGiftModel(kind) {
  const builder = BUILDERS[kind] || BUILDERS.giftbox;
  return builder();
}