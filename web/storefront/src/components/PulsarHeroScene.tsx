import { useEffect, useRef } from 'react';
import { useStorefront } from '../lib/storefront';

export default function PulsarHeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useStorefront();
  const modelUrl = settings.model3d;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      const THREE = await import('three');

      const heroEl = canvas.closest('.hero') as HTMLElement | null;
      if (!heroEl) return;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.set(0, 0, 7);

      const size = () => {
        const w = heroEl.clientWidth;
        const h = heroEl.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      size();

      const group = new THREE.Group();
      scene.add(group);

      let core: THREE.Mesh | null = null;
      let wire: THREE.LineSegments | null = null;

      if (modelUrl) {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        try {
          const gltf = await loader.loadAsync(modelUrl);
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const sizeV = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(sizeV.x, sizeV.y, sizeV.z) || 1;
          const scale = 3 / maxDim;
          model.scale.setScalar(scale);
          const center = box.getCenter(new THREE.Vector3());
          model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
          group.add(model);
        } catch (err) {
          console.error('[PulsarHero] Modèle 3D introuvable', err);
        }
      } else {
        const coreGeo = new THREE.IcosahedronGeometry(1.5, 1);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0x0c0c16, metalness: 0.85, roughness: 0.25 });
        core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        wire = new THREE.LineSegments(
          new THREE.EdgesGeometry(coreGeo),
          new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.55 })
        );
        wire.scale.setScalar(1.001);
        group.add(wire);
      }

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.6, 0.012, 16, 100),
        new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.6 })
      );
      ring.rotation.x = Math.PI / 2.4;
      group.add(ring);

      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(3.15, 0.008, 16, 100),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.35 })
      );
      ring2.rotation.x = Math.PI / 1.7;
      ring2.rotation.y = Math.PI / 5;
      group.add(ring2);

      const nodeColors = [0x00e5ff, 0x8b5cf6, 0xffffff, 0x00e5ff];
      const nodes: { mesh: THREE.Mesh; radius: number; speed: number; offset: number; tilt: number }[] = [];
      for (let i = 0; i < 4; i++) {
        const geo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
        const mat = new THREE.MeshStandardMaterial({ color: nodeColors[i], emissive: nodeColors[i], emissiveIntensity: 0.5, roughness: 0.4 });
        const m = new THREE.Mesh(geo, mat);
        nodes.push({ mesh: m, radius: 2.6 + (i % 2) * 0.5, speed: 0.25 + i * 0.08, offset: i * (Math.PI / 2), tilt: i % 2 ? 0.4 : -0.3 });
        scene.add(m);
      }

      const PARTICLE_COUNT = 400;
      const posArr = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const r = 3.6 + Math.random() * 1.8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        posArr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        posArr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        posArr[i * 3 + 2] = r * Math.cos(phi);
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x00e5ff,
        size: 0.028,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      scene.add(new THREE.AmbientLight(0x404060, 1.2));
      const pl1 = new THREE.PointLight(0x00e5ff, 3, 12);
      pl1.position.set(4, 2, 4);
      scene.add(pl1);
      const pl2 = new THREE.PointLight(0x8b5cf6, 3, 12);
      pl2.position.set(-4, -2, 3);
      scene.add(pl2);

      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let targetRotX = 0;
      let targetRotY = 0;
      let curRotX = 0;
      let curRotY = 0;

      const pointerDown = (e: PointerEvent | TouchEvent) => {
        const pe = e as PointerEvent;
        if (pe.button !== undefined && pe.button !== 0) return;
        dragging = true;
        const p = (e as TouchEvent).touches ? (e as TouchEvent).touches[0] : pe;
        lastX = p.clientX;
        lastY = p.clientY;
      };
      const pointerMove = (e: PointerEvent | TouchEvent) => {
        const p = (e as TouchEvent).touches ? (e as TouchEvent).touches[0] : (e as PointerEvent);
        if (dragging) {
          const dx = p.clientX - lastX;
          const dy = p.clientY - lastY;
          targetRotY += dx * 0.005;
          targetRotX += dy * 0.005;
          lastX = p.clientX;
          lastY = p.clientY;
        } else {
          const r = heroEl.getBoundingClientRect();
          const nx = (p.clientX - r.left) / r.width - 0.5;
          const ny = (p.clientY - r.top) / r.height - 0.5;
          camera.position.x = nx * 0.8;
          camera.position.y = -ny * 0.5;
          camera.lookAt(0, 0, 0);
        }
      };
      const pointerUp = () => {
        dragging = false;
      };

      canvas.addEventListener('pointerdown', pointerDown);
      window.addEventListener('pointermove', pointerMove);
      window.addEventListener('pointerup', pointerUp);
      window.addEventListener('resize', size);

      const clock = new THREE.Clock();
      let raf = 0;
      const animate = () => {
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        curRotX += (targetRotX - curRotX) * 0.08;
        curRotY += (targetRotY - curRotY) * 0.08;

        group.rotation.x = curRotX + Math.sin(t * 0.15) * 0.05;
        group.rotation.y = curRotY + t * 0.12;
        if (wire) wire.rotation.copy(group.rotation);

        ring.rotation.z = t * 0.2;
        ring2.rotation.z = -t * 0.15;
        particles.rotation.y = t * 0.03;

        nodes.forEach((n) => {
          const a = t * n.speed + n.offset;
          n.mesh.position.set(Math.cos(a) * n.radius, Math.sin(a * 0.6) * n.radius * n.tilt, Math.sin(a) * n.radius);
        });

        if (core) core.material.color.setHSL(0.6, 0.15, 0.08 + Math.sin(t * 0.6) * 0.01);
        renderer.render(scene, camera);
      };
      animate();
      canvas.classList.add('ready');

      cleanup = () => {
        cancelAnimationFrame(raf);
        canvas.removeEventListener('pointerdown', pointerDown);
        window.removeEventListener('pointermove', pointerMove);
        window.removeEventListener('pointerup', pointerUp);
        window.removeEventListener('resize', size);
        renderer.dispose();
      };
    };

    void init();

    return () => cleanup?.();
  }, [modelUrl]);

  return <canvas ref={canvasRef} id="heroCanvas" className="p3d-hero-canvas" data-edit-3d="hero" />;
}
