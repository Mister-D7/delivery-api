// App.tsx
import React, { useEffect, useRef, useState } from 'react';
import './App.css';

// ============================================
// DATA — Easily editable
// ============================================

const PRODUCTS = [
  {
    id: 1,
    category: 'earbuds',
    name: 'Pulsar Buds Air',
    price: 99,
    oldPrice: 129,
    badge: 'New',
    image: '/images/buds-air.jpg' // Replace with your image
  },
  {
    id: 2,
    category: 'earbuds',
    name: 'Pulsar Buds Pro',
    price: 179,
    oldPrice: 219,
    badge: 'Bestseller',
    image: '/images/buds-pro.jpg'
  },
  {
    id: 3,
    category: 'chargers',
    name: 'Pulsar GaN 65W',
    price: 49,
    oldPrice: 65,
    badge: 'In stock',
    image: '/images/gan-65w.jpg'
  },
  {
    id: 4,
    category: 'chargers',
    name: 'Pulsar MagCharge',
    price: 39,
    oldPrice: 49,
    badge: 'In stock',
    image: '/images/magcharge.jpg'
  },
  {
    id: 5,
    category: 'phones',
    name: 'Pulsar Phone S1',
    price: 699,
    oldPrice: 799,
    badge: 'New',
    image: '/images/phone-s1.jpg'
  },
  {
    id: 6,
    category: 'phones',
    name: 'Pulsar Phone S1 Pro',
    price: 899,
    oldPrice: 999,
    badge: 'Limited',
    image: '/images/phone-s1-pro.jpg'
  },
  {
    id: 7,
    category: 'laptops',
    name: 'Pulsar Book 14',
    price: 1199,
    oldPrice: 1349,
    badge: 'In stock',
    image: '/images/book-14.jpg'
  },
  {
    id: 8,
    category: 'laptops',
    name: 'Pulsar Book Pro 16',
    price: 1799,
    oldPrice: 1999,
    badge: 'In stock',
    image: '/images/book-pro-16.jpg'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'earbuds', label: 'Earbuds' },
  { id: 'chargers', label: 'Chargers' },
  { id: 'phones', label: 'Phones' },
  { id: 'laptops', label: 'Laptops' }
];

const FEATURES = [
  {
    num: '01',
    title: 'Shared fast-charge',
    desc: 'Every device — earbuds to laptop — charges on the same GaN standard, so one charger covers your whole bag.'
  },
  {
    num: '02',
    title: 'Cross-device handoff',
    desc: 'Calls, media and clipboard move instantly between your phone, buds and laptop with zero setup.'
  },
  {
    num: '03',
    title: 'Battery that lasts',
    desc: 'Real-world tested runtimes, not lab numbers — from a 30-hour earbud case to all-day laptop use.'
  }
];

const STATS = [
  { num: '50k+', label: 'Happy customers' },
  { num: '4.9/5', label: 'Average rating' },
  { num: '120+', label: 'Countries shipped' },
  { num: '24/7', label: 'Support' }
];

// ============================================
// THREE.JS COMPONENTS
// ============================================

// Hero 3D Scene
const HeroScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    let group: THREE.Group, core: THREE.Mesh, wire: THREE.LineSegments;
    let ring: THREE.Mesh, ring2: THREE.Mesh;
    let particles: THREE.Points;
    let nodes: any[] = [];
    let clock = new THREE.Clock();
    
    let dragging = false, lastX = 0, lastY = 0;
    let targetRotX = 0, targetRotY = 0, curRotX = 0, curRotY = 0;

    const init = async () => {
      const THREE = await import('three');
      
      const canvas = canvasRef.current!;
      const container = containerRef.current!;
      
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.set(0, 0, 7);

      const size = () => {
        const w = container.clientWidth, h = container.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      size();
      window.addEventListener('resize', size);

      group = new THREE.Group();
      scene.add(group);

      // Core icosahedron
      const coreGeo = new THREE.IcosahedronGeometry(1.5, 1);
      const coreMat = new THREE.MeshStandardMaterial({ 
        color: 0x0c0c16, 
        metalness: 0.85, 
        roughness: 0.25 
      });
      core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // Wireframe overlay
      wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(coreGeo),
        new THREE.LineBasicMaterial({ 
          color: 0x00e5ff, 
          transparent: true, 
          opacity: 0.55 
        })
      );
      wire.scale.setScalar(1.001);
      group.add(wire);

      // Orbit rings
      ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.6, 0.012, 16, 100),
        new THREE.MeshBasicMaterial({ 
          color: 0x8b5cf6, 
          transparent: true, 
          opacity: 0.6 
        })
      );
      ring.rotation.x = Math.PI / 2.4;
      group.add(ring);

      ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(3.15, 0.008, 16, 100),
        new THREE.MeshBasicMaterial({ 
          color: 0x00e5ff, 
          transparent: true, 
          opacity: 0.35 
        })
      );
      ring2.rotation.x = Math.PI / 1.7;
      ring2.rotation.y = Math.PI / 5;
      group.add(ring2);

      // Orbiting nodes
      const nodeColors = [0x00e5ff, 0x8b5cf6, 0xffffff, 0x00e5ff];
      for (let i = 0; i < 4; i++) {
        const geo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
        const mat = new THREE.MeshStandardMaterial({ 
          color: nodeColors[i], 
          emissive: nodeColors[i], 
          emissiveIntensity: 0.5, 
          roughness: 0.4 
        });
        const m = new THREE.Mesh(geo, mat);
        const radius = 2.6 + (i % 2) * 0.5;
        nodes.push({ 
          mesh: m, 
          radius, 
          speed: 0.25 + i * 0.08, 
          offset: i * (Math.PI / 2), 
          tilt: (i % 2 ? 0.4 : -0.3) 
        });
        scene.add(m);
      }

      // Particles
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
        depthWrite: false
      });
      particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      // Lights
      scene.add(new THREE.AmbientLight(0x404060, 1.2));
      const pl1 = new THREE.PointLight(0x00e5ff, 3, 12);
      pl1.position.set(4, 2, 4);
      scene.add(pl1);
      const pl2 = new THREE.PointLight(0x8b5cf6, 3, 12);
      pl2.position.set(-4, -2, 3);
      scene.add(pl2);

      // Interaction
      const pointerDown = (e: any) => {
        dragging = true;
        const p = e.touches ? e.touches[0] : e;
        lastX = p.clientX;
        lastY = p.clientY;
      };

      const pointerMove = (e: any) => {
        const p = e.touches ? e.touches[0] : e;
        if (dragging) {
          const dx = p.clientX - lastX;
          const dy = p.clientY - lastY;
          targetRotY += dx * 0.005;
          targetRotX += dy * 0.005;
          lastX = p.clientX;
          lastY = p.clientY;
        } else {
          const r = container.getBoundingClientRect();
          const nx = (p.clientX - r.left) / r.width - 0.5;
          const ny = (p.clientY - r.top) / r.height - 0.5;
          camera.position.x = nx * 0.8;
          camera.position.y = -ny * 0.5;
          camera.lookAt(0, 0, 0);
        }
      };

      const pointerUp = () => { dragging = false; };

      canvas.addEventListener('mousedown', pointerDown);
      canvas.addEventListener('touchstart', pointerDown, { passive: true });
      window.addEventListener('mousemove', pointerMove);
      window.addEventListener('touchmove', pointerMove, { passive: true });
      window.addEventListener('mouseup', pointerUp);
      window.addEventListener('touchend', pointerUp);

      animate();
    };

    const animate = () => {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      curRotX += (targetRotX - curRotX) * 0.08;
      curRotY += (targetRotY - curRotY) * 0.08;

      group.rotation.x = curRotX + Math.sin(t * 0.15) * 0.05;
      group.rotation.y = curRotY + t * 0.12;
      wire.rotation.copy(group.rotation);

      ring.rotation.z = t * 0.2;
      ring2.rotation.z = -t * 0.15;
      particles.rotation.y = t * 0.03;

      nodes.forEach((n: any) => {
        const a = t * n.speed + n.offset;
        n.mesh.position.set(
          Math.cos(a) * n.radius,
          Math.sin(a * 0.6) * n.radius * n.tilt,
          Math.sin(a) * n.radius
        );
      });

      core.material.color.setHSL(0.6, 0.15, 0.08 + Math.sin(t * 0.6) * 0.01);
      renderer.render(scene, camera);
    };

    init();

    return () => {
      window.removeEventListener('resize', () => {});
      renderer?.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', opacity: 0, transition: 'opacity 1.2s ease' }} />
    </div>
  );
};

// Spotlight 3D Scene
const SpotlightScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    let group: THREE.Group, led: THREE.Mesh;
    let clock = new THREE.Clock();
    let dragging = false, lastX = 0, lastY = 0;
    let rotY = 0.4, rotX = 0.15, targetY = 0.4, targetX = 0.15;

    const init = async () => {
      const THREE = await import('three');
      const canvas = canvasRef.current!;
      
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
      camera.position.set(0, 0.4, 5);

      const size = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight || w;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      size();
      window.addEventListener('resize', size);

      group = new THREE.Group();
      scene.add(group);

      // Case body
      const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0xe8e8f0, 
        metalness: 0.3, 
        roughness: 0.35 
      });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.55, 48), bodyMat);
      body.rotation.x = Math.PI / 2;
      group.add(body);

      // Lid seam ring
      const seam = new THREE.Mesh(
        new THREE.TorusGeometry(1.1, 0.02, 12, 64),
        new THREE.MeshStandardMaterial({ 
          color: 0x1a1a26, 
          metalness: 0.6, 
          roughness: 0.4 
        })
      );
      seam.position.z = 0.02;
      group.add(seam);

      // LED indicator
      led = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 16, 16),
        new THREE.MeshStandardMaterial({ 
          color: 0x00e5ff, 
          emissive: 0x00e5ff, 
          emissiveIntensity: 1.2 
        })
      );
      led.position.set(0, -0.75, 0.28);
      group.add(led);

      // Buds
      const makeBud = (x: number) => {
        const budGroup = new THREE.Group();
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.07, 0.5, 16),
          new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            metalness: 0.2, 
            roughness: 0.3 
          })
        );
        stem.position.y = -0.3;
        stem.rotation.z = 0.15 * (x > 0 ? 1 : -1);
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 20, 20),
          new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            metalness: 0.2, 
            roughness: 0.25 
          })
        );
        budGroup.add(stem, head);
        budGroup.position.set(x, 1.55, 0.35);
        budGroup.rotation.z = 0.25 * (x > 0 ? -1 : 1);
        return budGroup;
      };
      group.add(makeBud(-0.32), makeBud(0.32));

      // Lights
      scene.add(new THREE.AmbientLight(0x606070, 1.4));
      const kl = new THREE.PointLight(0x00e5ff, 2.5, 10);
      kl.position.set(3, 2, 3);
      scene.add(kl);
      const kl2 = new THREE.PointLight(0x8b5cf6, 2.5, 10);
      kl2.position.set(-3, -1, 2);
      scene.add(kl2);

      // Interaction
      canvas.addEventListener('mousedown', (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      });
      canvas.addEventListener('touchstart', (e) => {
        dragging = true;
        lastX = (e as TouchEvent).touches[0].clientX;
        lastY = (e as TouchEvent).touches[0].clientY;
      }, { passive: true });
      
      window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        targetY += (e.clientX - lastX) * 0.006;
        targetX += (e.clientY - lastY) * 0.006;
        lastX = e.clientX;
        lastY = e.clientY;
      });
      
      window.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        const t = (e as TouchEvent).touches[0];
        targetY += (t.clientX - lastX) * 0.006;
        targetX += (t.clientY - lastY) * 0.006;
        lastX = t.clientX;
        lastY = t.clientY;
      }, { passive: true });
      
      window.addEventListener('mouseup', () => { dragging = false; });
      window.addEventListener('touchend', () => { dragging = false; });

      animate();
    };

    const animate = () => {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      
      rotY += (targetY - rotY) * 0.1;
      rotX += (targetX - rotX) * 0.1;
      group.rotation.y = rotY + (dragging ? 0 : t * 0.15);
      group.rotation.x = rotX;
      led.material.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.4;
      
      renderer.render(scene, camera);
    };

    init();

    return () => {
      window.removeEventListener('resize', () => {});
      renderer?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: '1/1', cursor: 'grab', touchAction: 'none' }} />;
};

// ============================================
// UI COMPONENTS
// ============================================

const Preloader: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.random() * 18;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
        setTimeout(() => setHidden(true), 300);
      }
      setProgress(Math.floor(pct));
    }, 140);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`preloader ${hidden ? 'hide' : ''}`}>
      <div className="pre-ring" />
      <span className="pre-text">Loading {progress}%</span>
    </div>
  );
};

const Header: React.FC<{ cartCount: number }> = ({ cartCount }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header>
      <div className="wrap header-row">
        <a href="#" className="brand">
          <span className="brand-mark" />
          PULSAR
        </a>
        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          <a href="#earbuds" onClick={() => setMenuOpen(false)}>Earbuds</a>
          <a href="#chargers" onClick={() => setMenuOpen(false)}>Chargers</a>
          <a href="#phones" onClick={() => setMenuOpen(false)}>Phones</a>
          <a href="#laptops" onClick={() => setMenuOpen(false)}>Laptops</a>
        </nav>
        <div className="header-actions">
          <button className="cart-btn" aria-label="Cart">
            Cart <span className="cart-count">{cartCount}</span>
          </button>
          <button 
            className="burger" 
            id="burgerBtn" 
            aria-label="Menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

const CategoryCard: React.FC<{ icon: string; title: string; subtitle: string }> = ({ icon, title, subtitle }) => {
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(0)`);
  };

  return (
    <div 
      className="cat-card" 
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTransform('')}
    >
      <div className="cat-icon">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <span className="cat-arrow">↗</span>
    </div>
  );
};

const ProductCard: React.FC<{
  product: typeof PRODUCTS[0];
  onAddToCart: () => void;
}> = ({ product, onAddToCart }) => {
  const [added, setAdded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  };

  return (
    <div className="card" data-cat={product.category}>
      <div className="card-media">
        <span className="badge">{product.badge}</span>
        {/* Replace with actual image */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: `linear-gradient(150deg, #1a1a26, #0a0a10 75%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          color: '#8b5cf6'
        }}>
          {product.category === 'earbuds' ? '🎧' : 
           product.category === 'chargers' ? '⚡' : 
           product.category === 'phones' ? '📱' : '💻'}
        </div>
      </div>
      <div className="card-body">
        <span className="card-cat">{product.category}</span>
        <h3 className="card-name">{product.name}</h3>
        <div className="card-price">
          <span className="now">${product.price}</span>
          <span className="old">${product.oldPrice}</span>
        </div>
        <button className="btn btn-outline" onClick={handleClick}>
          {added ? 'Added ✓' : 'View'}
        </button>
      </div>
    </div>
  );
};

const Pill: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button className={`pill ${active ? 'active' : ''}`} onClick={onClick}>
    {label}
  </button>
);

// ============================================
// MAIN APP
// ============================================

const App: React.FC = () => {
  const [cartCount, setCartCount] = useState(0);
  const [filter, setFilter] = useState('all');

  const addToCart = () => setCartCount(prev => prev + 1);
  const filteredProducts = filter === 'all' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === filter);

  return (
    <div className="app">
      <Preloader />
      <Header cartCount={cartCount} />

      {/* Hero Section */}
      <section className="hero">
        <HeroScene />
        <div className="hero-content">
          <span className="eyebrow">Fall 2026 Lineup — In Stock</span>
          <h1 className="hero-title">
            Power that<br />moves <span className="grad">with you</span>
          </h1>
          <p className="hero-sub">
            Earbuds, chargers, phones and laptops engineered as one connected system — 
            fast to charge, effortless to carry, built to last.
          </p>
          <div className="hero-ctas">
            <a href="#shop" className="btn btn-solid">Shop the drop</a>
            <a href="#featured" className="btn btn-outline">See it in 3D</a>
          </div>
        </div>
        <div className="scroll-cue">
          <span>Scroll</span>
          <span className="line" />
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee">
        <div className="marquee-track">
          <span>Free worldwide shipping</span>
          <span>2-year warranty</span>
          <span>24/7 support</span>
          <span>Fast-charge certified</span>
          <span>30-day returns</span>
          <span>Free worldwide shipping</span>
          <span>2-year warranty</span>
          <span>24/7 support</span>
          <span>Fast-charge certified</span>
          <span>30-day returns</span>
        </div>
      </div>

      {/* Categories */}
      <section id="shop">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Shop by category</span>
              <h2 className="section-title">Four categories. <span className="accent">One ecosystem.</span></h2>
            </div>
            <p className="section-desc">
              Every device shares the same fast-charge standard, so your gear never fights over a cable.
            </p>
          </div>
          <div className="cat-grid">
            <CategoryCard icon="🎧" title="Earbuds" subtitle="ANC · 30H BATTERY" />
            <CategoryCard icon="⚡" title="Chargers" subtitle="GAN · 65–140W" />
            <CategoryCard icon="📱" title="Phones" subtitle="SNAPDRAGON · 5G" />
            <CategoryCard icon="💻" title="Laptops" subtitle="OLED · ALL-DAY" />
          </div>
        </div>
      </section>

      {/* Featured Spotlight */}
      <section id="featured">
        <div className="wrap">
          <div className="spotlight">
            <div>
              <span className="eyebrow">Featured — Pulsar Buds Pro</span>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Drag to spin it around</h2>
              <p className="section-desc" style={{ marginTop: 16, maxWidth: 'none' }}>
                Adaptive ANC, spatial audio and a case that wireless-charges off any Pulsar charger in under two hours.
              </p>
              <div className="spot-specs">
                <span className="spec-chip">30H battery</span>
                <span className="spec-chip">Adaptive ANC</span>
                <span className="spec-chip">IPX5</span>
                <span className="spec-chip">Wireless case</span>
              </div>
              <div className="spot-price">
                <span className="now">$179</span>
                <span className="old">$219</span>
              </div>
              <button className="btn btn-solid" onClick={addToCart}>Add to cart</button>
            </div>
            <SpotlightScene />
          </div>
        </div>
      </section>

      {/* Products */}
      <section>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">The lineup</span>
              <h2 className="section-title">Everything in <span className="accent">one place</span></h2>
            </div>
            <p className="section-desc">
              Filter by category — every product ships fully charged and ready to pair.
            </p>
          </div>
          <div className="pills">
            {CATEGORIES.map(cat => (
              <Pill
                key={cat.id}
                label={cat.label}
                active={filter === cat.id}
                onClick={() => setFilter(cat.id)}
              />
            ))}
          </div>
          <div className="grid">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={addToCart} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Why Pulsar</span>
              <h2 className="section-title">Built as <span className="accent">one system</span></h2>
            </div>
          </div>
          <div className="features">
            {FEATURES.map(feature => (
              <div key={feature.num} className="feature">
                <span className="feature-num">{feature.num}</span>
                <h4>{feature.title}</h4>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stats">
        {STATS.map(stat => (
          <div key={stat.label} className="stat">
            <div className="stat-num">{stat.num}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Newsletter */}
      <section className="newsletter">
        <div className="wrap">
          <span className="eyebrow">Stay charged</span>
          <h2>Get early access to drops</h2>
          <p>New products, restocks and member-only pricing — straight to your inbox.</p>
          <form 
            className="newsletter-form" 
            onSubmit={(e) => {
              e.preventDefault();
              const btn = e.currentTarget.querySelector('button');
              if (btn) btn.textContent = 'Subscribed ✓';
            }}
          >
            <input type="email" placeholder="Your email address" required />
            <button type="submit" className="btn btn-solid">Subscribe</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-col footer-brand">
              <a href="#" className="brand">
                <span className="brand-mark" />
                PULSAR
              </a>
              <p>Earbuds, chargers, phones and laptops built as one fast-charging ecosystem.</p>
            </div>
            <div className="footer-col">
              <h4>Shop</h4>
              <ul>
                <li><a href="#earbuds">Earbuds</a></li>
                <li><a href="#chargers">Chargers</a></li>
                <li><a href="#phones">Phones</a></li>
                <li><a href="#laptops">Laptops</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <ul>
                <li><a href="#">Track order</a></li>
                <li><a href="#">Warranty</a></li>
                <li><a href="#">Returns</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Sustainability</a></li>
                <li><a href="#">Privacy policy</a></li>
                <li><a href="#">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 PULSAR. All rights reserved.</span>
            <span>Designed for everyday power</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;