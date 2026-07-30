import { registerTemplate } from './index';

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NEXUS — {{STORE_NAME}}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#0b0c0f;
    --bg-2:#111217;
    --card:#15161c;
    --line: rgba(255,255,255,0.09);
    --line-soft: rgba(255,255,255,0.05);
    --ink:#eef0f3;
    --ink-soft:#a2a8b3;
    --muted:#5c6270;
    --accent:#49d3ff;
    --accent-dim: rgba(73,211,255,0.14);
    --accent-2:#ff4d7d;
    --ok:#5ce6a6;
  }
  body.mode-composants{
    --accent:#8b6bff;
    --accent-dim: rgba(139,107,255,0.16);
  }
  *{box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{
    margin:0; background:var(--bg); color:var(--ink);
    font-family:'Inter', sans-serif; -webkit-font-smoothing:antialiased;
  }
  a{color:inherit; text-decoration:none;}
  .display{font-family:'Space Grotesk', sans-serif;}
  .mono{font-family:'JetBrains Mono', monospace; letter-spacing:.02em;}
  ::selection{ background:var(--accent); color:#04070a;}
  body::before{
    content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:
      linear-gradient(var(--line-soft) 1px, transparent 1px),
      linear-gradient(90deg, var(--line-soft) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 75%);
    opacity:.6;
  }
  header{
    position:sticky; top:0; z-index:50;
    background:rgba(11,12,15,0.86); backdrop-filter: blur(12px);
    border-bottom:1px solid var(--line);
  }
  .header-top{
    display:flex; align-items:center; justify-content:space-between;
    padding:18px 32px; max-width:1280px; margin:0 auto;
  }
  .logo{
    font-family:'Space Grotesk', sans-serif; font-weight:700; font-size:21px;
    letter-spacing:.04em; display:flex; align-items:center; gap:9px; text-transform:uppercase;
  }
  .logo .bolt{ width:9px; height:9px; background:var(--accent); transform:rotate(45deg); box-shadow:0 0 14px var(--accent); transition:.4s;}
  nav.primary-nav{ display:flex; gap:32px; align-items:center;}
  nav.primary-nav a{
    font-size:13.5px; color:var(--ink-soft); position:relative; padding:4px 0;
    text-transform:uppercase; letter-spacing:.03em; transition:color .25s;
  }
  nav.primary-nav a:hover{ color:var(--ink);}
  nav.primary-nav a::after{
    content:''; position:absolute; left:0; bottom:-2px; height:1px; width:0%;
    background:var(--accent); transition:width .3s ease;
  }
  nav.primary-nav a:hover::after{ width:100%;}
  .header-actions{ display:flex; align-items:center; gap:20px;}
  .mode-switch{
    position:relative; display:flex; border:1px solid var(--line); border-radius:3px;
    padding:3px; background:var(--bg-2);
  }
  .mode-switch button{
    border:none; background:transparent; font-family:'JetBrains Mono',monospace;
    font-size:10.5px; letter-spacing:.08em; text-transform:uppercase;
    padding:8px 15px; border-radius:2px; cursor:pointer; color:var(--muted);
    position:relative; z-index:2; transition:color .3s;
  }
  .mode-switch button.active{ color:#04070a;}
  .mode-switch .thumb{
    position:absolute; top:3px; left:3px; height:calc(100% - 6px); width:calc(50% - 3px);
    background:var(--accent); border-radius:2px; box-shadow:0 0 16px var(--accent-dim);
    transition: transform .35s cubic-bezier(.6,-0.1,.3,1.2), background .4s;
    z-index:1;
  }
  body.mode-composants .mode-switch .thumb{ transform:translateX(100%);}
  .icon-btn{ cursor:pointer; opacity:.75; font-size:13px; transition:opacity .2s;}
  .icon-btn:hover{ opacity:1; color:var(--accent);}
  .cat-strip-outer{ border-top:1px solid var(--line); overflow-x:auto; scrollbar-width:none;}
  .cat-strip-outer::-webkit-scrollbar{ display:none;}
  .cat-strip{ display:flex; gap:9px; padding:14px 32px; max-width:1280px; margin:0 auto; white-space:nowrap;}
  .cat-pill{
    font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:.02em;
    padding:9px 15px; border:1px solid var(--line); border-radius:2px;
    cursor:pointer; color:var(--ink-soft); background:transparent; transition:all .25s ease; flex:0 0 auto;
  }
  .cat-pill:hover{ border-color:var(--accent); color:var(--ink);}
  .cat-pill.active{ background:var(--accent); color:#04070a; border-color:var(--accent);}
  .hero{ position:relative; padding:90px 32px 70px; overflow:hidden; z-index:1;}
  .hero-grid{
    max-width:1280px; margin:0 auto; display:grid; grid-template-columns:1.05fr .95fr; gap:56px; align-items:center;
  }
  .hero-eyebrow{
    font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:.16em; text-transform:uppercase;
    color:var(--accent); margin-bottom:20px; display:flex; align-items:center; gap:10px;
  }
  .hero-eyebrow::before{ content:''; width:24px; height:1px; background:var(--accent);}
  .hero h1{
    font-family:'Space Grotesk', sans-serif; font-weight:700; font-size:clamp(36px,4.6vw,60px);
    line-height:1.02; margin:0 0 22px; letter-spacing:-.01em; text-transform:uppercase;
  }
  .hero h1 span{ color:var(--accent); text-shadow:0 0 30px var(--accent-dim);}
  .hero p.lede{ font-size:16px; line-height:1.65; color:var(--ink-soft); max-width:460px; margin:0 0 32px;}
  .hero-ctas{ display:flex; gap:14px; flex-wrap:wrap;}
  .btn{
    display:inline-flex; align-items:center; gap:10px; padding:14px 26px; border-radius:3px;
    font-size:13px; font-weight:600; letter-spacing:.03em; text-transform:uppercase;
    cursor:pointer; border:1px solid var(--accent); transition: all .25s ease;
  }
  .btn-solid{ background:var(--accent); color:#04070a;}
  .btn-solid:hover{ box-shadow:0 0 26px var(--accent-dim); transform:translateY(-1px);}
  .btn-outline{ background:transparent; color:var(--ink); border-color:var(--line);}
  .btn-outline:hover{ border-color:var(--accent); color:var(--accent);}
  .hero-visual{
    aspect-ratio:4/3.1; border-radius:4px; position:relative; overflow:hidden;
    background: radial-gradient(circle at 30% 20%, rgba(73,211,255,.22), transparent 55%),
                linear-gradient(160deg,#161822 0%, #0a0b0e 70%);
    border:1px solid var(--line);
  }
  body.mode-composants .hero-visual{
    background: radial-gradient(circle at 30% 20%, rgba(139,107,255,.22), transparent 55%),
                linear-gradient(160deg,#161822 0%, #0a0b0e 70%);
  }
  .hero-visual svg{ position:absolute; inset:0; width:100%; height:100%;}
  .hero-visual .tag{
    position:absolute; top:18px; left:18px; background:rgba(11,12,15,.82); border:1px solid var(--line);
    padding:10px 13px; border-radius:2px; font-family:'JetBrains Mono',monospace; font-size:10.5px;
    color:var(--ink-soft); line-height:1.6;
  }
  .tag b{ color:var(--accent); display:block; font-size:13px; margin-bottom:1px;}
  .hero-meters{ position:absolute; bottom:18px; left:18px; right:18px; display:flex; gap:16px;}
  .hmeter{ flex:1; font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--ink-soft); text-transform:uppercase;}
  .hmeter .bar{ height:4px; background:var(--line); border-radius:2px; margin-top:6px; overflow:hidden;}
  .hmeter .bar i{ display:block; height:100%; background:var(--accent); box-shadow:0 0 8px var(--accent-dim); border-radius:2px;}
  section.pad{ padding:64px 0 10px; position:relative; z-index:1;}
  .section-head{
    display:flex; align-items:flex-end; justify-content:space-between;
    max-width:1280px; margin:0 auto; padding:0 32px 26px; gap:20px; flex-wrap:wrap;
  }
  .section-head h2{ font-family:'Space Grotesk',sans-serif; font-size:27px; font-weight:700; margin:0; text-transform:uppercase; letter-spacing:-.005em;}
  .section-head .count{ font-family:'JetBrains Mono', monospace; font-size:11.5px; color:var(--muted);}
  .grid{
    max-width:1280px; margin:0 auto; padding:0 32px 30px;
    display:grid; grid-template-columns:repeat(4,1fr); gap:22px;
  }
  .card{
    background:var(--card); border:1px solid var(--line); border-radius:3px; overflow:hidden;
    display:flex; flex-direction:column; opacity:0; transform:translateY(14px);
    animation: rise .5s ease forwards; transition:border-color .25s;
  }
  .card:hover{ border-color: rgba(255,255,255,.22);}
  @keyframes rise{ to{ opacity:1; transform:translateY(0);} }
  .card-media{ aspect-ratio:4/3; position:relative; overflow:hidden;}
  .card-media .bg{ position:absolute; inset:0; transition:transform .5s ease;}
  .card:hover .card-media .bg{ transform:scale(1.06);}
  .card-media svg{ position:absolute; inset:0; width:100%; height:100%; opacity:.5;}
  .badge{
    position:absolute; top:10px; left:10px; background:var(--accent); color:#04070a;
    font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:.05em;
    padding:5px 8px; border-radius:2px; text-transform:uppercase; font-weight:600;
  }
  .badge.stock-low{ background:var(--accent-2); color:#fff;}
  .card-body{ padding:15px 16px 17px; display:flex; flex-direction:column; gap:9px; flex:1;}
  .card-body h3{ font-family:'Space Grotesk',sans-serif; font-size:14.5px; font-weight:600; margin:0;}
  .specs{ display:flex; gap:6px; flex-wrap:wrap;}
  .specs span{
    font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--ink-soft);
    border:1px solid var(--line); padding:3px 7px; border-radius:2px;
  }
  .price-row{ margin-top:auto; display:flex; align-items:baseline; gap:8px; font-family:'JetBrains Mono',monospace;}
  .price-row .now{ font-size:16px; font-weight:600; color:var(--ink);}
  .price-row .old{ font-size:11.5px; color:var(--muted); text-decoration:line-through;}
  .stock{ font-size:10px; color:var(--ok); text-transform:uppercase; letter-spacing:.04em; font-family:'JetBrains Mono',monospace;}
  .stock.low{ color:var(--accent-2);}
  .empty-state{ grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--muted); font-family:'JetBrains Mono',monospace; font-size:13px;}
  .configurator{ border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:76px 32px; position:relative; z-index:1;}
  .config-head{ max-width:1280px; margin:0 auto 40px;}
  .config-head .hero-eyebrow{ margin-bottom:14px;}
  .config-head h2{ font-family:'Space Grotesk',sans-serif; font-size:clamp(28px,3.4vw,42px); margin:0 0 12px; text-transform:uppercase; font-weight:700;}
  .config-head p{ color:var(--ink-soft); max-width:560px; font-size:14.5px; line-height:1.6; margin:0;}
  .config-wrap{ max-width:1280px; margin:0 auto; display:grid; grid-template-columns:1.4fr .9fr; gap:40px; align-items:start;}
  .config-steps{ display:flex; flex-direction:column; gap:26px;}
  .config-step .step-label{
    display:flex; align-items:center; gap:10px; margin-bottom:12px;
    font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted);
  }
  .config-step .step-label .idx{ color:var(--accent);}
  .option-row{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px;}
  .option{
    border:1px solid var(--line); background:var(--bg-2); border-radius:3px; padding:14px 14px;
    cursor:pointer; transition:all .2s ease; text-align:left;
  }
  .option:hover{ border-color:rgba(255,255,255,.25);}
  .option.active{ border-color:var(--accent); background:var(--accent-dim); box-shadow:inset 0 0 0 1px var(--accent);}
  .option .oname{ font-family:'Space Grotesk',sans-serif; font-size:13.5px; font-weight:600; margin-bottom:4px;}
  .option .odesc{ font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--ink-soft);}
  .option .oprice{ font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--accent); margin-top:8px;}
  .config-summary{
    position:sticky; top:110px; background:var(--card); border:1px solid var(--line); border-radius:4px; padding:26px;
  }
  .config-summary h3{ font-family:'Space Grotesk',sans-serif; font-size:16px; text-transform:uppercase; margin:0 0 18px;}
  .summary-line{
    display:flex; justify-content:space-between; font-size:12.5px; color:var(--ink-soft); padding:9px 0; border-bottom:1px solid var(--line-soft);
    font-family:'JetBrains Mono',monospace;
  }
  .summary-line span:last-child{ color:var(--ink);}
  .summary-total{ display:flex; justify-content:space-between; align-items:baseline; margin:18px 0 20px;}
  .summary-total .label{ font-family:'JetBrains Mono',monospace; font-size:11px; text-transform:uppercase; color:var(--muted);}
  .summary-total .amount{ font-family:'Space Grotesk',sans-serif; font-size:30px; font-weight:700; color:var(--accent);}
  .perf-meters{ display:flex; flex-direction:column; gap:14px; margin-bottom:22px;}
  .perf-meters .hmeter{ font-size:10px;}
  .config-add{ width:100%; justify-content:center;}
  .config-msg{ margin-top:12px; font-size:11.5px; color:var(--ok); font-family:'JetBrains Mono',monospace; min-height:16px; text-align:center;}
  .newsletter{ padding:80px 32px; text-align:center; position:relative; z-index:1;}
  .newsletter-inner{ max-width:560px; margin:0 auto;}
  .newsletter h2{ font-family:'Space Grotesk',sans-serif; font-size:28px; font-weight:700; margin:0 0 12px; text-transform:uppercase;}
  .newsletter p{ color:var(--ink-soft); font-size:14px; margin:0 0 28px; line-height:1.6;}
  .nform{ display:flex; border:1px solid var(--line); border-radius:3px; overflow:hidden; padding:4px;}
  .nform input{ flex:1; border:none; background:transparent; padding:11px 16px; font-size:14px; outline:none; font-family:'Inter',sans-serif; color:var(--ink);}
  .nform button{
    border:none; background:var(--accent); color:#04070a; padding:11px 22px; border-radius:2px; cursor:pointer;
    font-size:12.5px; font-weight:700; text-transform:uppercase; letter-spacing:.03em; transition:.3s;
  }
  .nform button:hover{ box-shadow:0 0 18px var(--accent-dim);}
  .nform-msg{ margin-top:12px; font-size:12px; color:var(--accent); min-height:16px; font-family:'JetBrains Mono',monospace;}
  footer{ background:var(--bg-2); border-top:1px solid var(--line); color:#c6c9d1; padding:60px 32px 24px; position:relative; z-index:1;}
  .footer-grid{
    max-width:1280px; margin:0 auto; display:grid; grid-template-columns:1.3fr repeat(4,1fr); gap:32px; padding-bottom:40px; border-bottom:1px solid var(--line);
  }
  .footer-brand .logo{ margin-bottom:14px;}
  .footer-brand p{ font-size:12.5px; color:var(--muted); line-height:1.6; max-width:260px;}
  .fcol h5{ font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin:0 0 16px;}
  .fcol a{ display:block; font-size:13px; color:#c6c9d1; margin-bottom:11px; transition:color .2s;}
  .fcol a:hover{ color:var(--accent);}
  .footer-bottom{ max-width:1280px; margin:20px auto 0; display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; font-size:11.5px; color:var(--muted); font-family:'JetBrains Mono',monospace;}
  @media (max-width:980px){
    nav.primary-nav{ display:none;}
    .hero-grid{ grid-template-columns:1fr;}
    .grid{ grid-template-columns:repeat(2,1fr);}
    .config-wrap{ grid-template-columns:1fr;}
    .config-summary{ position:static;}
    .footer-grid{ grid-template-columns:repeat(2,1fr);}
    .option-row{ grid-template-columns:1fr 1fr;}
  }
  @media (max-width:560px){
    .grid{ grid-template-columns:1fr 1fr; gap:12px;}
    .option-row{ grid-template-columns:1fr;}
    .wrap,.header-top,.cat-strip,.hero,.section-head,.grid,.configurator,.newsletter,footer{ padding-left:18px; padding-right:18px;}
  }
  @media (prefers-reduced-motion: reduce){ *{ animation-duration:.01ms !important; transition-duration:.01ms !important;} }
</style>
</head>
<body class="mode-systems">

<header>
  <div class="header-top">
    <a class="logo" href="#top"><span class="bolt"></span>{{STORE_NAME}}</a>
    <nav class="primary-nav">
      <a href="#collection" data-scroll>Catalogue</a>
      <a href="#configurator" data-scroll>Configurateur</a>
      <a href="#newsletter" data-scroll>Alertes Drops</a>
      <a href="#">Support</a>
    </nav>
    <div class="header-actions">
      <div class="mode-switch" id="modeSwitch">
        <div class="thumb"></div>
        <button class="active" data-mode="systems">Systèmes</button>
        <button data-mode="composants">Composants</button>
      </div>
      <span class="icon-btn">Compte</span>
      <span class="icon-btn">Panier · 0</span>
    </div>
  </div>
  <div class="cat-strip-outer">
    <div class="cat-strip" id="catStrip">{{CATEGORIES}}</div>
  </div>
</header>

<main id="top">

  <section class="hero">
    <div class="hero-grid">
      <div>
        <div class="hero-eyebrow">Assemblé & testé en France</div>
        <h1 id="heroTitle">{{HERO_TITLE}}<br><span>la frame qui compte.</span></h1>
        <p class="lede" id="heroLede">{{TAGLINE}}</p>
        <div class="hero-ctas">
          <a class="btn btn-solid" href="#configurator" data-scroll>Configurer mon PC</a>
          <a class="btn btn-outline" href="#collection" data-scroll>Voir le catalogue</a>
        </div>
      </div>
      <div class="hero-visual">
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="hg1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="var(--accent)" stop-opacity="0.5"/>
              <stop offset="1" stop-color="var(--accent)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <g stroke="var(--accent)" stroke-opacity="0.35" fill="none" stroke-width="1">
            <rect x="60" y="60" width="280" height="180" rx="4"/>
            <path d="M60 100 H340 M60 160 H340 M60 200 H340"/>
            <path d="M120 60 V240 M220 60 V240 M280 60 V240"/>
          </g>
          <circle cx="200" cy="150" r="70" fill="url(#hg1)"/>
        </svg>
        <div class="tag" id="heroTag"><b>RTX 4070 Super</b>Ryzen 7 · 32GB · 1TB NVMe</div>
        <div class="hero-meters">
          <div class="hmeter">Gaming 1440p<div class="bar"><i style="width:88%"></i></div></div>
          <div class="hmeter">Rendu / Création<div class="bar"><i style="width:72%"></i></div></div>
          <div class="hmeter">Streaming<div class="bar"><i style="width:80%"></i></div></div>
        </div>
      </div>
    </div>
  </section>

  <section class="pad" id="collection">
    <div class="section-head">
      <h2 id="gridTitle">Tout voir</h2>
      <div class="count"><span id="resultCount">0</span> références</div>
    </div>
    <div class="grid" id="productGrid">{{PRODUCTS}}</div>
  </section>

  <section class="configurator" id="configurator">
    <div class="config-head">
      <div class="hero-eyebrow">Configurateur</div>
      <h2>Assemblez votre config,<br>en direct.</h2>
      <p>Choisissez chaque composant. Le prix et les performances estimées se mettent à jour en temps réel.</p>
    </div>
    <div class="config-wrap">
      <div class="config-steps" id="configSteps"></div>
      <div class="config-summary">
        <h3>Votre configuration</h3>
        <div id="summaryLines"></div>
        <div class="summary-total">
          <span class="label">Total estimé</span>
          <span class="amount" id="summaryTotal">0€</span>
        </div>
        <div class="perf-meters" id="perfMeters"></div>
        <button class="btn btn-solid config-add" id="configAddBtn">Ajouter au panier</button>
        <div class="config-msg" id="configMsg"></div>
      </div>
    </div>
  </section>

  <section class="newsletter" id="newsletter">
    <div class="newsletter-inner">
      <h2>Ne ratez aucun drop</h2>
      <p>Nouvelles références, restocks et ventes flash — un email par semaine, jamais plus.</p>
      <form class="nform" id="nform">
        <input type="email" placeholder="votre@email.com" required>
        <button type="submit">Rejoindre</button>
      </form>
      <div class="nform-msg" id="nformMsg"></div>
    </div>
  </section>

</main>

<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <a class="logo" href="#top"><span class="bolt"></span>{{STORE_NAME}}</a>
      <p>Hardware gaming sélectionné, configuré et testé poste par poste, avec support technique dédié et garantie pièces 3 ans.</p>
    </div>
    <div class="fcol">
      <h5>Boutique</h5>
      <a href="#collection" data-scroll>Catalogue complet</a>
      <a href="#configurator" data-scroll>Configurateur</a>
      <a href="#">Ventes flash</a>
      <a href="#">Occasions reconditionnées</a>
    </div>
    <div class="fcol">
      <h5>Support</h5>
      <a href="#">Suivi de commande</a>
      <a href="#">Garantie 3 ans</a>
      <a href="#">SAV & réparation</a>
      <a href="#">FAQ technique</a>
    </div>
    <div class="fcol">
      <h5>Entreprise</h5>
      <a href="#">Notre banc de test</a>
      <a href="#">Nos ingénieurs</a>
      <a href="#">Recrutement</a>
      <a href="#">Presse</a>
    </div>
    <div class="fcol">
      <h5>Suivez-nous</h5>
      <a href="#">Discord</a>
      <a href="#">Twitch</a>
      <a href="#">YouTube</a>
      <a href="#">X / Twitter</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>2026 © {{STORE_NAME}}. Tous droits réservés.</span>
    <span>CGV · Confidentialité · Cookies</span>
  </div>
</footer>

<script>
const CATEGORIES = {
  systems: ["Tout voir","Nouveautés","Best-Sellers","PC Bureau","Laptops Gaming","Mini-ITX","Stations Créateur","Consoles"],
  composants: ["Tout voir","Nouveautés","Best-Sellers","Cartes Graphiques","Processeurs","Cartes Mères","Mémoire RAM","Stockage","Alimentations","Boîtiers","Refroidissement","Écrans","Claviers & Souris","Casques"]
};
const DATA = window.__DATA__ || { products: [], categories: [] };
const HERO_COPY = {
  systems: {
    title: document.getElementById('heroTitle')?.innerHTML || 'Construit pour<br><span>la frame qui compte.</span>',
    lede: document.getElementById('heroLede')?.textContent || 'Des configurations gaming pensées poste par poste.',
    tag: '<b>RTX 4070 Super</b>Ryzen 7 · 32GB · 1TB NVMe'
  },
  composants: {
    title: 'Chaque pièce compte.<br><span>Assemblez la vôtre.</span>',
    lede: 'Composants sélectionnés et compatibles entre eux.',
    tag: '<b>Radeon RX 7800 XT</b>16GB GDDR6 · 263W'
  }
};
let state = { mode:'systems', category:'Tout voir' };
const catStrip = document.getElementById('catStrip');
const grid = document.getElementById('productGrid');
const gridTitle = document.getElementById('gridTitle');
const resultCount = document.getElementById('resultCount');

function renderCats(){
  catStrip.innerHTML = '';
  CATEGORIES[state.mode].forEach(cat=>{
    const btn = document.createElement('button');
    btn.className = 'cat-pill' + (cat === state.category ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', ()=>{
      state.category = cat; renderCats(); renderGrid();
      document.getElementById('collection')?.scrollIntoView({behavior:'smooth', block:'start'});
    });
    catStrip.appendChild(btn);
  });
}

function renderGrid(){
  const items = state.category === 'Tout voir' ? DATA.products : DATA.products.filter(p => p.category === state.category);
  gridTitle.textContent = state.category;
  resultCount.textContent = items.length;
  grid.innerHTML = '';
  if(items.length === 0){
    grid.innerHTML = '<div class="empty-state">Aucun produit pour le moment.</div>'; return;
  }
  items.forEach((p, idx)=>{
    const card = document.createElement('div');
    card.className = 'card'; card.style.animationDelay = (idx * 0.04) + 's';
    card.innerHTML = '<div class="card-media"><div class="bg" style="background:linear-gradient(135deg,#161822,#0a0b0e)"></div></div>' +
      '<div class="card-body"><h3>' + p.name + '</h3>' +
      '<div class="price-row"><span class="now">' + p.price + '€</span>' +
      (p.oldPrice ? '<span class="old">' + p.oldPrice + '€</span>' : '') + '</div>' +
      '<div class="stock">En stock</div></div>';
    grid.appendChild(card);
  });
}

const modeSwitch = document.getElementById('modeSwitch');
if(modeSwitch){
  modeSwitch.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const m = btn.getAttribute('data-mode');
      if(m === state.mode) return;
      state.mode = m; state.category = 'Tout voir';
      modeSwitch.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b === btn));
      document.body.classList.toggle('mode-composants', m === 'composants');
      document.body.classList.toggle('mode-systems', m === 'systems');
      const copy = HERO_COPY[m];
      document.getElementById('heroTitle').innerHTML = copy.title;
      document.getElementById('heroLede').textContent = copy.lede;
      document.getElementById('heroTag').innerHTML = copy.tag;
      renderCats(); renderGrid();
    });
  });
}

document.getElementById('nform')?.addEventListener('submit', function(e){
  e.preventDefault();
  document.getElementById('nformMsg').textContent = "Bienvenue à bord — vous recevrez les prochains drops en avant-première.";
  this.reset();
});

document.querySelectorAll('[data-scroll]').forEach(a=>{
  a.addEventListener('click', function(e){
    const target = document.querySelector(this.getAttribute('href'));
    if(target){ e.preventDefault(); target.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
});

renderCats(); renderGrid();
</script>
</body>
</html>`;

registerTemplate({
  id: 'nexus-gaming',
  name: 'NEXUS Gaming',
  storeType: 'tech',
  description: 'Dark theme gaming avec configurateur PC — design cyberpunk cyan',
  preview: '',
  theme: {
    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
    bgColor: '#0b0c0f',
    surfaceColor: '#15161c',
    textColor: '#eef0f3',
    accentColor: '#49d3ff',
    glowColor: '#49d3ff',
    glowEnabled: true,
    animationEnabled: true,
    glassEnabled: false,
  },
  html,
});
