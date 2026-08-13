import { useEffect, useRef, useState } from 'react';
import { useStorefront } from '../lib/storefront';
import { imgSrc, isImageUrl } from '../lib/image';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const PAN_RANGE = 1.5;

export default function PulsarSpotlightScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef<{ zoomIn: () => void; zoomOut: () => void; reset: () => void } | null>(null);
  const panRef = useRef<{ getPanX: () => number; panBy: (d: number) => void } | null>(null);
  const { products, settings } = useStorefront();
  const featured = products.find((p) => p.modelUrl);
  const modelUrl = featured?.modelUrl || settings.model3d;
  const imageUrl = isImageUrl(modelUrl) ? modelUrl : null;

  const panTrackRef = useRef<HTMLDivElement>(null);
  const [panFrac, setPanFracState] = useState(0.5);
  const panFracRef = useRef(0.5);
  const panDragging = useRef(false);
  const setPanFrac = (f: number) => {
    const v = Math.max(0, Math.min(1, f));
    panFracRef.current = v;
    setPanFracState(v);
  };
  const panFromEvent = (clientY: number) => {
    const el = panTrackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.height === 0) return;
    setPanFrac((clientY - rect.top) / rect.height);
  };
  const onPanDown = (e: React.PointerEvent<HTMLDivElement>) => {
    panDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    panFromEvent(e.clientY);
  };
  const onPanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (panDragging.current) panFromEvent(e.clientY);
  };
  const onPanUp = () => {
    panDragging.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !modelUrl || imageUrl) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      const THREE = await import('three');

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;

      const scene = new THREE.Scene();
      const base = 5.4;
      const baseFor = (aspect: number) => {
        const tanH = Math.tan((20 * Math.PI) / 180) * Math.max(aspect, 0.35);
        const needed = 1.5 / tanH;
        return Math.max(base, Math.min(needed, 13));
      };
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
      camera.position.set(0, 0.4, baseFor(1));

      const MIN_DIST = 1.8;
      const MAX_DIST = 12;
      const limits = () =>
        window.innerWidth < 768
          ? { min: 0.9, max: 7, floor: 0.45 }
          : { min: MIN_DIST, max: MAX_DIST, floor: 0.72 };
      let aspect = 1;
      let dist = baseFor(1);
      let targetDist = dist;
      let userZoomed = false;
      const clampDist = (v: number) => {
        const lim = limits();
        const floor = Math.max(lim.min, baseFor(aspect) * lim.floor);
        return Math.max(floor, Math.min(lim.max, v));
      };
      let panX = 0;
      let targetPanX = 0;
      let panY = 0;
      let targetPanY = 0;
      zoomRef.current = {
        zoomIn: () => { userZoomed = true; targetDist = clampDist(targetDist * 0.75); },
        zoomOut: () => { userZoomed = true; targetDist = clampDist(targetDist / 0.75); },
        reset: () => {
          userZoomed = false;
          targetDist = baseFor(aspect);
          targetPanX = 0;
          panFracRef.current = 0.5;
          setPanFracState(0.5);
        },
      };
      panRef.current = {
        getPanX: () => panX,
        panBy: (d) => { targetPanX += d; },
      };

      const size = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight || w;
        if (!w) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        aspect = w / h;
        camera.updateProjectionMatrix();
        if (!userZoomed) {
          dist = clampDist(baseFor(aspect));
          targetDist = dist;
        }
      };
      size();

      const group = new THREE.Group();
      scene.add(group);

      const loader = new GLTFLoader();
      try {
        const gltf = await loader.loadAsync(modelUrl);
        const model = gltf.scene;
        model.updateMatrixWorld(true);

        const junk: any[] = [];
        model.traverse((o: any) => {
          if ((o as any).isLight || (o as any).isCamera) junk.push(o);
        });
        junk.forEach((o) => o.parent?.remove(o));

        const box = new THREE.Box3();
        model.traverse((o: any) => {
          if ((o as any).isMesh) box.expandByObject(o);
        });
        if (box.isEmpty()) box.setFromObject(model);
        const sizeV = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(sizeV.x, sizeV.y, sizeV.z) || 1;
        const scale = 2.0 / maxDim;
        model.scale.setScalar(scale);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

        model.traverse((o: any) => {
          const mesh = o as any;
          if (!mesh.isMesh) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m: any) => {
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

      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

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

      const ptr = new Map<number, { x: number; y: number }>();
      let mode: 'none' | 'rotate' | 'panzoom' = 'none';
      let lastX = 0;
      let lastY = 0;
      let rotY = 0.4;
      let rotX = 0.15;
      let targetY = 0.4;
      let targetX = 0.15;
      let lastMid = { x: 0, y: 0 };
      let lastPinch = 0;

      const pDist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
        Math.hypot(a.x - b.x, a.y - b.y);

      const onDown = (e: PointerEvent) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (ptr.size === 2) {
          mode = 'panzoom';
          const [a, b] = [...ptr.values()];
          lastPinch = pDist(a, b);
          lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          return;
        }
        mode = 'rotate';
        lastX = e.clientX;
        lastY = e.clientY;
      };
      const onMove = (e: PointerEvent) => {
        if (!ptr.has(e.pointerId)) return;
        ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (mode === 'panzoom' && ptr.size === 2) {
          const [a, b] = [...ptr.values()];
          const d = pDist(a, b);
          if (lastPinch > 0 && d > 0) targetDist = clampDist(targetDist * (lastPinch / d));
          lastPinch = d;
          const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const dy = mid.y - lastMid.y;
          const dx = mid.x - lastMid.x;
          lastMid = mid;
          if (dy !== 0) setPanFrac(panFracRef.current + dy * 0.004);
          if (dx !== 0) panRef.current?.panBy(dx * 0.004);
          return;
        }
        if (mode === 'rotate' && ptr.size === 1) {
          targetY += (e.clientX - lastX) * 0.006;
          targetX += (e.clientY - lastY) * 0.006;
          lastX = e.clientX;
          lastY = e.clientY;
        }
      };
      const onUp = (e: PointerEvent) => {
        ptr.delete(e.pointerId);
        if (ptr.size === 0) {
          mode = 'none';
          return;
        }
        if (ptr.size === 1 && mode === 'panzoom') {
          mode = 'rotate';
          const [p] = [...ptr.values()];
          lastX = p.x;
          lastY = p.y;
        }
      };

      canvas.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      window.addEventListener('resize', size);

      let lastFrame = performance.now();
      let raf = 0;
      const animate = () => {
        raf = requestAnimationFrame(animate);
        const now = performance.now();
        const dt = (now - lastFrame) / 1000;
        lastFrame = now;

        rotY += (targetY - rotY) * 0.1;
        rotX += (targetX - rotX) * 0.1;
        dist += (targetDist - dist) * 0.12;
        targetPanY = (0.5 - panFracRef.current) * (2 * PAN_RANGE);
        panX += (targetPanX - panX) * 0.12;
        panY += (targetPanY - panY) * 0.12;
        if (mode === 'none') rotY += dt * 0.15;
        camera.position.set(panX, 0.4 + panY, dist);
        group.rotation.y = rotY;
        group.rotation.x = rotX;

        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(raf);
        zoomRef.current = null;
        panRef.current = null;
        canvas.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        window.removeEventListener('resize', size);
        renderer.dispose();
      };
    };

    void init();

    return () => cleanup?.();
  }, [modelUrl]);

  if (imageUrl) {
    return (
      <div className="spot-3d-wrap">
        <img
          className="spot-img"
          src={imgSrc(imageUrl)}
          alt="Produit vedette"
          loading="lazy"
        />
      </div>
    );
  }

  if (!modelUrl) {
    return (
      <div className="spot-3d-wrap">
        <div className="spot-empty" data-edit-3d="spotlight">
          <span>Modèle 3D</span>
          <small>Aucun objet défini</small>
        </div>
      </div>
    );
  }

  return (
    <div className="spot-3d-wrap">
      <canvas ref={canvasRef} id="spotlightCanvas" data-edit-3d="spotlight" />
      <div
        ref={panTrackRef}
        className="spot-pan"
        aria-label="Déplacer l'objet de haut en bas"
        title="Déplacer l'objet de haut en bas"
        onPointerDown={onPanDown}
        onPointerMove={onPanMove}
        onPointerUp={onPanUp}
        onPointerCancel={onPanUp}
      >
        <div className="spot-pan-line" />
        <div className="spot-pan-ball" style={{ top: `calc(${panFrac * 100}% - 9px)` }} />
      </div>
      <div className="spot-zoom">
        <button type="button" aria-label="Zoom avant" title="Zoom avant" onClick={() => zoomRef.current?.zoomIn()}>+</button>
        <button type="button" aria-label="Zoom arrière" title="Zoom arrière" onClick={() => zoomRef.current?.zoomOut()}>−</button>
        <button type="button" aria-label="Réinitialiser le zoom" title="Réinitialiser le zoom" onClick={() => zoomRef.current?.reset()}>↺</button>
      </div>
    </div>
  );
}
