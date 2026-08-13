import { useEffect, useRef } from 'react';

export default function PreorderThree() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE: any = await import('three');
      if (disposed || !container) return;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0.5, 5);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0x222244, 0.6));
      const keyLight = new THREE.DirectionalLight(0x4488ff, 2.0);
      keyLight.position.set(2, 3, 4);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0x8844ff, 0.8);
      fillLight.position.set(-3, 1, -2);
      scene.add(fillLight);
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
      rimLight.position.set(0, -2, 3);
      scene.add(rimLight);

      const knot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.9, 0.28, 128, 24),
        new THREE.MeshPhysicalMaterial({
          color: 0x2a7de1, emissive: 0x1a3a7a, emissiveIntensity: 0.25,
          metalness: 0.7, roughness: 0.15, clearcoat: 0.3,
          clearcoatRoughness: 0.2, transparent: true, opacity: 0.92,
        })
      );
      knot.position.y = 0.1;
      scene.add(knot);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.15, 0.035, 64, 64),
        new THREE.MeshPhysicalMaterial({
          color: 0x7c5cfc, emissive: 0x5a3ccc, emissiveIntensity: 0.5,
          metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.6,
        })
      );
      ring.position.y = 0.1;
      ring.rotation.x = Math.PI / 2.5;
      scene.add(ring);

      const wireRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.35, 0.012, 48, 48),
        new THREE.MeshPhysicalMaterial({
          color: 0x4488ff, emissive: 0x2244aa, emissiveIntensity: 0.2,
          metalness: 0.3, roughness: 0.6, transparent: true, opacity: 0.25,
        })
      );
      wireRing.position.y = 0.1;
      wireRing.rotation.x = Math.PI / 3;
      wireRing.rotation.z = 0.3;
      scene.add(wireRing);

      const particleCount = 800;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const r = 1.6 + Math.random() * 1.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5 + 0.1;
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particles = new THREE.Points(
        particleGeo,
        new THREE.PointsMaterial({
          color: 0x6699ff, size: 0.035, transparent: true, opacity: 0.5,
          blending: THREE.AdditiveBlending, sizeAttenuation: true,
        })
      );
      scene.add(particles);

      const clock = new THREE.Clock();
      const animate = () => {
        if (disposed) return;
        const t = clock.getElapsedTime();
        knot.rotation.x = t * 0.18;
        knot.rotation.y = t * 0.28;
        knot.rotation.z = t * 0.08;
        ring.rotation.y = t * 0.15;
        ring.rotation.z = t * 0.05;
        wireRing.rotation.y = t * 0.1;
        wireRing.rotation.x = Math.PI / 3 + Math.sin(t * 0.2) * 0.05;
        particles.rotation.y = t * 0.04;
        particles.rotation.x = Math.sin(t * 0.03) * 0.02;
        camera.position.x = Math.sin(t * 0.06) * 0.25;
        camera.position.y = 0.5 + Math.sin(t * 0.04) * 0.1;
        camera.lookAt(0, 0.1, 0);
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };
      animate();

      const resize = () => {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', resize);
      const ro = new ResizeObserver(resize);
      ro.observe(container);

      const c = () => {
        ro.disconnect();
        window.removeEventListener('resize', resize);
        renderer.dispose();
        if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      };
      cleanup = c;
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div id="po-three-canvas" ref={containerRef} aria-hidden="true" />;
}
