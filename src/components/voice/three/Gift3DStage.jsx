import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildGiftObject } from '@/components/voice/three/giftObject';

/**
 * Hediye gönderildiğinde oynayan gerçek 3D animasyon: hediye kendi 3D modeliyle ekrana gelir,
 * havada yavaşça döner, çevresinde ışıltı parçacıkları yükselir, altındaki ışık halkası nefes alır.
 * WebGL yoksa hiçbir şey çizilmez; oda çalışmaya devam eder.
 */
export default function Gift3DStage({ gift, color = '#facc15', className = '' }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (error) {
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'block h-full w-full';
    host.appendChild(renderer.domElement);

    const tone = new THREE.Color(color);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x120c18, 1.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(3.5, 5, 4.5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(tone, 45, 24, 2);
    rimLight.position.set(-3.2, 1.8, 2.6);
    scene.add(rimLight);
    const floorLight = new THREE.PointLight(tone, 30, 18, 2);
    floorLight.position.set(0, -2.4, 1.4);
    scene.add(floorLight);

    const root = new THREE.Group();
    scene.add(root);

    // Zemin halkası: hediyenin altında nefes alan ışık.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.15, 1.8, 64),
      new THREE.MeshBasicMaterial({
        color: tone, transparent: true, opacity: 0.4, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.4;
    root.add(ring);

    // Işıltı parçacıkları: hediyenin çevresinde yükselip başa döner.
    const COUNT = 85;
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let index = 0; index < COUNT; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.9 + Math.random() * 1.6;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 3.4;
      positions[index * 3 + 2] = Math.sin(angle) * radius;
      speeds[index] = 0.35 + Math.random() * 0.6;
    }
    const sparkGeometry = new THREE.BufferGeometry();
    sparkGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const sparks = new THREE.Points(
      sparkGeometry,
      new THREE.PointsMaterial({
        color: tone, size: 0.14, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      })
    );
    root.add(sparks);

    // Dönen gövde: hediye modeli buraya eklenir.
    const spinner = new THREE.Group();
    root.add(spinner);

    let mixer = null;
    let stopped = false;
    let frame = 0;

    buildGiftObject(gift).then((result) => {
      if (!result || stopped) return;
      spinner.add(result.object);
      mixer = result.mixer;
    });

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
      const time = clock.elapsedTime;

      // Giriş: bir saniyede hafif taşarak büyür, sonra sakin nefes alır.
      const enter = Math.min(time / 0.9, 1);
      const overshoot = 1 + Math.sin(enter * Math.PI) * 0.22;
      const breath = 0.94 + Math.sin(time * 1.4) * 0.025;
      root.scale.setScalar(Math.max(0.01, enter * overshoot * breath));

      // Dönüş: ilk saniyede hızlı, ardından yavaş ve sürekli.
      const spin = time < 1 ? 10 * (1 - time) : 0.85 + Math.sin(time * 0.6) * 0.25;
      spinner.rotation.y += delta * spin;
      spinner.position.y = Math.sin(time * 1.5) * 0.12;
      spinner.rotation.z = Math.sin(time * 0.9) * 0.05;

      // Kamera: uzaktan yaklaşır, sonra hafif yörüngede gezer.
      const dolly = THREE.MathUtils.lerp(8.4, 4.9, Math.min(time / 1.1, 1));
      camera.position.set(Math.sin(time * 0.35) * 1.5, 0.9 + Math.sin(time * 0.5) * 0.22, dolly);
      camera.lookAt(0, 0.08, 0);

      ring.scale.setScalar(1 + Math.sin(time * 2.2) * 0.08);
      ring.material.opacity = 0.26 + Math.sin(time * 2.2) * 0.14;

      const points = sparkGeometry.attributes.position;
      for (let index = 0; index < COUNT; index += 1) {
        let y = points.getY(index) + delta * speeds[index];
        if (y > 1.9) y = -1.9;
        points.setY(index, y);
      }
      points.needsUpdate = true;
      sparks.rotation.y += delta * 0.3;

      mixer?.update(delta);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
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
      renderer.domElement.remove();
      scene.clear();
    };
  }, [gift?.name, gift?.model_url, gift?.model_kind, color]);

  return <div ref={hostRef} className={className} />;
}