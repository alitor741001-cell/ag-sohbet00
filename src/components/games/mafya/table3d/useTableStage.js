import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildStage } from './buildStage';
import { HEAD_HEIGHT, HEAD_SIZE, focusAzimuth, seatRadius } from './seatRing';

const FOV = 34;
const TAN_HALF = Math.tan((FOV * Math.PI) / 360);
const LOOK_HEIGHT = 0.8;
const ELEVATION = 0.68; // masaya yukarıdan bakış: koltuklar birbirine girmez
const MIN_DISTANCE = 4.6;
const MAX_DISTANCE = 14;
const AUTO_SPIN = 0.055;
const IDLE_MS = 6000;
const DRAG_SENSITIVITY = 0.0058;
const MIN_SCALE = 0.74;
const MAX_SCALE = 1.16;

const shortestDelta = (from, to) => {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
};

/** 3D sahneyi kurar, kamerayı yörüngede tutar ve her gerçek yüzü kendi koltuğuna yansıtır.
    Kamera uzaklığı ekrana göre kendini ayarlar: bütün koltuklar her ekranda görünür kalır. */
export default function useTableStage({ hostRef, faceRefs, capacity, frontIndex, stateRef, onFail }) {
  const failRef = useRef(onFail);
  failRef.current = onFail;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (error) {
      failRef.current?.();
      return undefined;
    }

    const { scene, camera, seats } = buildStage({ capacity, frontIndex });
    const radius = seatRadius(capacity);
    const canvas = renderer.domElement;
    canvas.className = 'mf-stage-canvas';
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(canvas);

    let width = 0;
    let height = 0;
    let refSize = 72;
    let distance = MIN_DISTANCE;
    let azimuth = 0;
    let dragging = null;
    let idleUntil = 0;
    let frame = 0;
    let last = 0;

    const lookAt = new THREE.Vector3(0, LOOK_HEIGHT, 0);
    const center = new THREE.Vector3(0, HEAD_HEIGHT, 0);
    const first = new THREE.Vector3();
    const second = new THREE.Vector3();
    const scratch = new THREE.Vector3();

    /** Dünya noktasını ekran pikseline çevirir (z: derinlik). */
    const toScreen = (point, out) => {
      out.copy(point).project(camera);
      out.set((out.x * 0.5 + 0.5) * width, (-out.y * 0.5 + 0.5) * height, out.z);
      return out;
    };

    /** Bir noktadaki yüzün ekrandaki çapı (piksel). */
    const faceSizeAt = (point) => {
      toScreen(point, scratch);
      const top = scratch.y;
      scratch.set(point.x, point.y + HEAD_SIZE, point.z);
      toScreen(scratch, scratch);
      return Math.abs(scratch.y - top);
    };

    const placeCamera = (range) => {
      camera.position.set(Math.sin(azimuth) * range, LOOK_HEIGHT + range * Math.tan(ELEVATION), Math.cos(azimuth) * range);
      camera.lookAt(lookAt);
      camera.updateMatrixWorld();
    };

    /** Masayı çerçeveye sığdıran, sonra yüzler birbirine girmeyecek kadar uzaklaştıran mesafe. */
    const tuneDistance = () => {
      const halfWidth = radius + 0.32;
      const halfHeight = radius * Math.sin(ELEVATION) + 0.8 * Math.cos(ELEVATION);
      const fit = Math.max(
        (halfWidth * 1.1) / (TAN_HALF * camera.aspect),
        (halfHeight * 1.2) / TAN_HALF
      );
      let range = Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, fit));
      for (let step = 0; step < 24 && range < MAX_DISTANCE; step += 1) {
        placeCamera(range);
        const face = faceSizeAt(center);
        let spacing = Infinity;
        for (let i = 0; i < seats.length; i += 1) {
          toScreen(seats[i].head, first);
          const x = first.x;
          const y = first.y;
          for (let j = i + 1; j < seats.length; j += 1) {
            toScreen(seats[j].head, second);
            spacing = Math.min(spacing, Math.hypot(x - second.x, y - second.y));
          }
        }
        if (spacing >= face * 1.35) return range;
        range += 0.25;
      }
      return range;
    };

    const measure = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      distance = tuneDistance();
      placeCamera(distance);
      // Orta mesafedeki bir yüzün ekran boyu: yüzler bu ölçüye göre ölçeklenir.
      refSize = Math.max(24, faceSizeAt(center));
      host.style.setProperty('--mf-face', `${refSize.toFixed(1)}px`);
    };

    const applySeat = (index, data) => {
      const seat = seats[index];
      if (!seat) return;
      const dead = !!data && data.alive === false;
      const on = !!data && data.selected;
      if (seat.state === `${dead ? 'd' : 'a'}${on ? 's' : ''}`) return;
      seat.state = `${dead ? 'd' : 'a'}${on ? 's' : ''}`;
      seat.ring.visible = on;
      seat.suit.emissiveIntensity = on ? 0.34 : 0;
      seat.suit.color.setHex(dead ? 0x14131a : seat.suit.userData.tone);
      seat.skin.color.setHex(dead ? 0x2a2320 : seat.skin.userData.tone);
      seat.figure.rotation.x = dead ? 0.72 : 0;
      seat.figure.position.y = dead ? -0.04 : 0;
    };

    const tick = (time) => {
      frame = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.05, (time - last) / 1000) : 0.016;
      last = time;
      const state = stateRef.current || {};
      const selectedIndex = typeof state.selectedIndex === 'number' ? state.selectedIndex : -1;

      if (!dragging) {
        if (selectedIndex >= 0) {
          const target = focusAzimuth(selectedIndex, capacity, frontIndex);
          azimuth += shortestDelta(azimuth, target) * (1 - Math.exp(-dt * 3.4));
        } else if (time > idleUntil) {
          azimuth += dt * AUTO_SPIN;
        }
      }
      placeCamera(distance);

      if (width && height) {
        for (let index = 0; index < seats.length; index += 1) {
          const node = faceRefs.current[index];
          const data = state.seats ? state.seats[index] : null;
          applySeat(index, data);
          if (!node) continue;
          if (!data) {
            node.style.visibility = 'hidden';
            continue;
          }
          toScreen(seats[index].head, first);
          if (first.z < -1 || first.z > 1) {
            node.style.visibility = 'hidden';
            continue;
          }
          const size = faceSizeAt(seats[index].head);
          const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, size / refSize));
          const x = first.x;
          const y = first.y;
          node.style.visibility = 'visible';
          node.style.zIndex = String(Math.max(1, Math.round((1 - first.z) * 500)));
          node.style.transform = `translate3d(calc(${x.toFixed(1)}px - 50%), calc(${y.toFixed(1)}px - 50%), 0) scale(${scale.toFixed(3)})`;
        }
      }

      renderer.render(scene, camera);
    };

    const onPointerDown = (event) => {
      dragging = { x: event.clientX, azimuth };
      canvas.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event) => {
      if (!dragging) return;
      azimuth = dragging.azimuth + (event.clientX - dragging.x) * DRAG_SENSITIVITY;
      idleUntil = performance.now() + IDLE_MS;
    };
    const onPointerUp = (event) => {
      if (!dragging) return;
      dragging = null;
      idleUntil = performance.now() + IDLE_MS;
      canvas.releasePointerCapture?.(event.pointerId);
    };
    const onLost = (event) => {
      event.preventDefault();
      failRef.current?.();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('webglcontextlost', onLost);

    const observer = new ResizeObserver(measure);
    observer.observe(host);
    measure();
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('webglcontextlost', onLost);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      scene.traverse((node) => {
        if (node.geometry) node.geometry.dispose?.();
        const list = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
        list.forEach((material) => material.dispose?.());
      });
      renderer.dispose?.();
    };
  }, [capacity, frontIndex, hostRef, faceRefs, stateRef]);
}