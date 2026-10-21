import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { buildGiftModel } from '@/components/voice/three/proceduralModels';
import { giftModelKind } from '@/lib/gift3d';

/**
 * Gerçek zamanlı 3D hediye görüntüleyici.
 * model_url varsa GLB/GLTF yüklenir ve içindeki animasyon oynatılır; yoksa aynı hediye için
 * tarayıcıda üretilen temsili 3D geometri gösterilir (resim değil, gerçek 3D nesne).
 * Sürükle: döndür · Tekerlek / iki parmak: yakınlaştır.
 */
export default function Gift3DViewer({ gift, autoRotate = true, className = '' }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'block h-full w-full touch-none';
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x1b1030, 1.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3.5, 5, 4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xff9ec4, 1.2);
    fillLight.position.set(-4, -2, 2);
    scene.add(fillLight);

    const root = new THREE.Group();
    scene.add(root);

    let mixer = null;
    let stopped = false;
    let frame = 0;
    let distance = 4.6;

    const place = (object) => {
      const bounds = new THREE.Box3().setFromObject(object);
      const size = bounds.getSize(new THREE.Vector3());
      object.position.sub(bounds.getCenter(new THREE.Vector3()));
      const wrap = new THREE.Group();
      wrap.add(object);
      const max = Math.max(size.x, size.y, size.z) || 1;
      wrap.scale.setScalar(2.4 / max);
      root.add(wrap);
    };

    if (gift?.model_url) {
      new GLTFLoader().load(
        gift.model_url,
        (gltf) => {
          if (stopped) return;
          place(gltf.scene);
          if (gltf.animations?.length) {
            mixer = new THREE.AnimationMixer(gltf.scene);
            gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
          }
        },
        undefined,
        () => {
          if (!stopped) place(buildGiftModel(giftModelKind(gift)));
        }
      );
    } else {
      place(buildGiftModel(giftModelKind(gift)));
    }

    const element = renderer.domElement;
    const pointers = new Map();
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let pinchStart = 0;
    let pinchDistance = 0;

    const onDown = (event) => {
      element.setPointerCapture?.(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 1) {
        dragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
      }
      if (pointers.size === 2) {
        const [first, second] = [...pointers.values()];
        pinchDistance = Math.hypot(first.x - second.x, first.y - second.y) || 1;
        pinchStart = distance;
      }
    };

    const onMove = (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2) {
        const [first, second] = [...pointers.values()];
        const spread = Math.hypot(first.x - second.x, first.y - second.y) || 1;
        distance = THREE.MathUtils.clamp(pinchStart * (pinchDistance / spread), 2.4, 9);
        return;
      }
      if (!dragging) return;
      root.rotation.y += (event.clientX - lastX) * 0.012;
      root.rotation.x = THREE.MathUtils.clamp(root.rotation.x + (event.clientY - lastY) * 0.008, -0.9, 0.9);
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const onUp = (event) => {
      pointers.delete(event.pointerId);
      if (pointers.size === 0) dragging = false;
    };

    const onWheel = (event) => {
      event.preventDefault();
      distance = THREE.MathUtils.clamp(distance + event.deltaY * 0.0025, 2.4, 9);
    };

    element.addEventListener('pointerdown', onDown);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerup', onUp);
    element.addEventListener('pointercancel', onUp);
    element.addEventListener('wheel', onWheel, { passive: false });

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const clock = new THREE.Clock();
    const tick = () => {
      if (stopped) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      if (autoRotate && !dragging) root.rotation.y += delta * 0.55;
      root.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.05;
      mixer?.update(delta);
      camera.position.set(0, 0.3, distance);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener('pointerdown', onDown);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', onUp);
      element.removeEventListener('pointercancel', onUp);
      element.removeEventListener('wheel', onWheel);
      root.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            material.map?.dispose();
            material.dispose();
          });
        }
      });
      renderer.dispose();
      element.remove();
      scene.clear();
    };
  }, [gift?.id, gift?.model_url, gift?.model_kind, autoRotate]);

  return <div ref={hostRef} className={className} />;
}