import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { buildGiftModel } from '@/components/voice/three/proceduralModels';
import { giftModelKind } from '@/lib/gift3d';

/**
 * Hediyenin gerçek 3D nesnesini hazırlar: kayıtta GLB/GLTF varsa dosya yüklenir ve içindeki
 * animasyon oynatılır; yoksa aynı hediye için tarayıcıda üretilen 3D geometri kurulur.
 * Dönen grup sahne boyutuna göre normalize edilir (en uzun kenar 2.4 birim).
 */
export function buildGiftObject(gift) {
  return new Promise((resolve) => {
    const wrap = new THREE.Group();

    const finish = (object, mixer) => {
      const bounds = new THREE.Box3().setFromObject(object);
      const size = bounds.getSize(new THREE.Vector3());
      object.position.sub(bounds.getCenter(new THREE.Vector3()));
      const holder = new THREE.Group();
      holder.add(object);
      holder.scale.setScalar(2.4 / (Math.max(size.x, size.y, size.z) || 1));
      wrap.add(holder);
      resolve({ object: wrap, mixer });
    };

    if (!String(gift?.model_url || '').trim()) {
      finish(buildGiftModel(giftModelKind(gift)), null);
      return;
    }

    new GLTFLoader().load(
      gift.model_url,
      (gltf) => {
        let mixer = null;
        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(gltf.scene);
          gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        }
        finish(gltf.scene, mixer);
      },
      undefined,
      () => finish(buildGiftModel(giftModelKind(gift)), null)
    );
  });
}