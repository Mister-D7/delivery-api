import { useEffect, useRef } from 'react';
import { useStorefront } from '../lib/storefront';

export default function PulsarSpotlightScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useStorefront();
  const modelUrl = settings.model3d;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      const THREE = await import('three');

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;

      const scene = new THREE.Scene();
      const isModel = Boolean(modelUrl);
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
      camera.position.set(0, 0.4, isModel ? 5.4 : 5);

      const size = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight || w;
        if (!w) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      size();

      const group = new THREE.Group();
      scene.add(group);

      let led: THREE.Mesh | null = null;

      if (modelUrl) {
        const [{ GLTFLoader }, { RoomEnvironment }] = await Promise.all([
          import('three/examples/jsm/loaders/GLTFLoader.js'),
          import('three/examples/jsm/environments/RoomEnvironment.js'),
        ]);
        const loader = new GLTFLoader();
        try {
          const gltf = await loader.loadAsync(modelUrl);
          const model = gltf.scene;
          model.updateMatrixWorld(true);

          const junk: THREE.Object3D[] = [];
          model.traverse((o) => {
            if ((o as THREE.Object3D).isLight || (o as THREE.Object3D).isCamera) junk.push(o);
          });
          junk.forEach((o) => o.parent?.remove(o));

          const box = new THREE.Box3();
          model.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) box.expandByObject(o);
          });
          if (box.isEmpty()) box.setFromObject(model);
          const sizeV = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(sizeV.x, sizeV.y, sizeV.z) || 1;
          const scale = 2.0 / maxDim;
          model.scale.setScalar(scale);
          const center = box.getCenter(new THREE.Vector3());
          model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

          model.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              if (!m) return;
              m.transparent = false;
              m.opacity = 1;
              m.depthWrite = true;
            });
          });

          group.add(model);
        } catch (err) {
          console.error('[PulsarSpotlight] Modèle 3D introuvable', err);
        }
      } else {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8e8f0, metalness: 0.3, roughness: 0.35 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.55, 48), bodyMat);
        body.rotation.x = Math.PI / 2;
        group.add(body);

        const seam = new THREE.Mesh(
          new THREE.TorusGeometry(1.1, 0.02, 12, 64),
          new THREE.MeshStandardMaterial({ color: 0x1a1a26, metalness: 0.6, roughness: 0.4 })
        );
        seam.position.z = 0.02;
        group.add(seam);

        led = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.2 })
        );
        led.position.set(0, -0.75, 0.28);
        group.add(led);

        const makeBud = (x: number) => {
          const budGroup = new THREE.Group();
          const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.07, 0.5, 16),
            new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.3 })
          );
          stem.position.y = -0.3;
          stem.rotation.z = 0.15 * (x > 0 ? 1 : -1);
          const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 20, 20),
            new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.25 })
          );
          budGroup.add(stem, head);
          budGroup.position.set(x, 1.55, 0.35);
          budGroup.rotation.z = 0.25 * (x > 0 ? -1 : 1);
          return budGroup;
        };
        group.add(makeBud(-0.32), makeBud(0.32));
      }

      if (isModel) {
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      }

      if (isModel) {
        scene.add(new THREE.AmbientLight(0xffffff, 2.0));
        const key = new THREE.DirectionalLight(0xffffff, 4.0);
        key.position.set(4, 6, 5);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 1.8);
        fill.position.set(-5, -2, 3);
        scene.add(fill);
        const back = new THREE.DirectionalLight(0xffffff, 1.3);
        back.position.set(0, 3, -5);
        scene.add(back);
        const ledLight = new THREE.PointLight(0xffffff, 3.0, 12);
        ledLight.position.set(2, 4, -2);
        scene.add(ledLight);
      } else {
        scene.add(new THREE.AmbientLight(0x606070, 1.4));
        const kl = new THREE.PointLight(0x00e5ff, 2.5, 10);
        kl.position.set(3, 2, 3);
        scene.add(kl);
        const kl2 = new THREE.PointLight(0x8b5cf6, 2.5, 10);
        kl2.position.set(-3, -1, 2);
        scene.add(kl2);
      }

      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let rotY = 0.4;
      let rotX = 0.15;
      let targetY = 0.4;
      let targetX = 0.15;

      const onDown = (e: PointerEvent | TouchEvent) => {
        const pe = e as PointerEvent;
        if (pe.button !== undefined && pe.button !== 0) return;
        dragging = true;
        const p = (e as TouchEvent).touches ? (e as TouchEvent).touches[0] : pe;
        lastX = p.clientX;
        lastY = p.clientY;
      };
      const onMove = (e: PointerEvent | TouchEvent) => {
        if (!dragging) return;
        const p = (e as TouchEvent).touches ? (e as TouchEvent).touches[0] : (e as PointerEvent);
        targetY += (p.clientX - lastX) * 0.006;
        targetX += (p.clientY - lastY) * 0.006;
        lastX = p.clientX;
        lastY = p.clientY;
      };
      const onUp = () => {
        dragging = false;
      };

      canvas.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('resize', size);

      const t0 = performance.now();
      let raf = 0;
      const animate = () => {
        raf = requestAnimationFrame(animate);
        const t = (performance.now() - t0) / 1000;

        rotY += (targetY - rotY) * 0.1;
        rotX += (targetX - rotX) * 0.1;
        group.rotation.y = rotY + (dragging ? 0 : t * 0.15);
        group.rotation.x = rotX;
        if (led) led.material.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.4;

        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(raf);
        canvas.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('resize', size);
        renderer.dispose();
      };
    };

    void init();

    return () => cleanup?.();
  }, [modelUrl]);

  return <canvas ref={canvasRef} id="spotlightCanvas" data-edit-3d="spotlight" />;
}
