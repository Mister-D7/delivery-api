const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vestiaire — {{STORE_NAME}}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --paper:#eeede6;
    --paper-2:#e6e4da;
    --ink:#1a1b16;
    --ink-soft:#4a4a42;
    --muted:#8b8a7e;
    --line: rgba(26,27,22,0.14);
    --card:#fbfaf6;
    --brass:#a9855a;
    --accent:#2c3a54;
    --accent-soft:#2c3a5414;
    --accent-2: #7c8a9a;
    --radius: 2px;
  }
  body.mode-femme{
    --accent:#6e2a3a;
    --accent-soft:#6e2a3a14;
    --accent-2:#b98d95;
  }
  *{box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{
    margin:0;
    background:var(--paper);
    color:var(--ink);
    font-family:'Inter', sans-serif;
    -webkit-font-smoothing:antialiased;
    transition: background .5s ease;
  }
  a{color:inherit; text-decoration:none;}
  .display{font-family:'Fraunces', serif;}
  .mono{font-family:'IBM Plex Mono', monospace; letter-spacing:.02em;}
  .wrap{max-width:1240px; margin:0 auto; padding:0 32px;}

  header{
    position:sticky; top:0; z-index:50;
    background:rgba(238,237,230,0.88);
    backdrop-filter: blur(10px);
    border-bottom:1px solid var(--line);
  }
  .header-top{
    display:flex; align-items:center; justify-content:space-between;
    padding:18px 32px;
    max-width:1240px; margin:0 auto;
  }
  .logo{
    font-family:'Fraunces', serif; font-weight:600; font-size:22px;
    letter-spacing:.01em;
    display:flex; align-items:center; gap:8px;
  }
  .logo .dot{width:7px; height:7px; border-radius:50%; background:var(--accent); transition:background .4s;}
  nav.primary-nav{
    display:flex; gap:34px; align-items:center;
  }
  nav.primary-nav a{
    font-size:14px; color:var(--ink-soft);
    position:relative; padding:4px 0;
    transition:color .25s;
  }
  nav.primary-nav a:hover{color:var(--ink);}
  nav.primary-nav a::after{
    content:''; position:absolute; left:0; bottom:-2px; height:1px; width:0%;
    background:var(--accent); transition:width .3s ease;
  }
  nav.primary-nav a:hover::after{width:100%;}

  .header-actions{display:flex; align-items:center; gap:22px;}
  .gender-switch{
    position:relative; display:flex; border:1px solid var(--line);
    border-radius:20px; padding:3px; background:var(--card);
  }
  .gender-switch button{
    border:none; background:transparent; font-family:'IBM Plex Mono', monospace;
    font-size:11px; letter-spacing:.08em; text-transform:uppercase;
    padding:7px 16px; border-radius:18px; cursor:pointer; color:var(--muted);
    position:relative; z-index:2; transition:color .3s;
  }
  .gender-switch button.active{color:#fff;}
  .gender-switch .thumb{
    position:absolute; top:3px; left:3px; height:calc(100% - 6px);
    width:calc(50% - 3px); background:var(--accent); border-radius:18px;
    transition: transform .35s cubic-bezier(.6,-0.1,.3,1.2), background .4s;
    z-index:1;
  }
  body.mode-femme .gender-switch .thumb{ transform: translateX(100%); }

  .icon-btn{ cursor:pointer; opacity:.75; transition:opacity .2s;}
  .icon-btn:hover{opacity:1;}

  .cat-strip-outer{
    border-top:1px solid var(--line);
    overflow-x:auto;
    scrollbar-width:none;
  }
  .cat-strip-outer::-webkit-scrollbar{display:none;}
  .cat-strip{
    display:flex; gap:10px; padding:14px 32px; max-width:1240px; margin:0 auto;
    white-space:nowrap;
  }
  .cat-pill{
    font-family:'IBM Plex Mono', monospace; font-size:11.5px; letter-spacing:.03em;
    padding:9px 16px; border:1px solid var(--line); border-radius:20px;
    cursor:pointer; color:var(--ink-soft); background:transparent;
    transition: all .25s ease; flex:0 0 auto;
  }
  .cat-pill:hover{ border-color: var(--accent); color:var(--ink);}
  .cat-pill.active{ background:var(--ink); color:#fff; border-color:var(--ink);}

  .hero{
    position:relative; padding:76px 32px 60px; overflow:hidden;
  }
  .hero-grid{
    max-width:1240px; margin:0 auto; display:grid;
    grid-template-columns: 1.1fr .9fr; gap:56px; align-items:center;
  }
  .hero-eyebrow{
    font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:.14em;
    text-transform:uppercase; color:var(--brass); margin-bottom:18px;
    display:flex; align-items:center; gap:10px;
  }
  .hero-eyebrow::before{content:''; width:22px; height:1px; background:var(--brass);}
  .hero h1{
    font-size:clamp(38px,5vw,64px); line-height:1.03; margin:0 0 22px; font-weight:500;
    letter-spacing:-.01em;
  }
  .hero h1 em{ font-style:italic; color:var(--accent); font-weight:400; transition:color .4s;}
  .hero p.lede{ font-size:16.5px; line-height:1.65; color:var(--ink-soft); max-width:440px; margin:0 0 32px;}
  .hero-ctas{ display:flex; gap:14px; flex-wrap:wrap;}
  .btn{
    display:inline-flex; align-items:center; gap:10px;
    padding:14px 26px; border-radius:30px; font-size:13.5px; font-weight:500;
    cursor:pointer; border:1px solid var(--ink); transition: all .25s ease;
  }
  .btn-solid{ background:var(--ink); color:#fff;}
  .btn-solid:hover{ background:var(--accent); border-color:var(--accent);}
  .btn-outline{ background:transparent; color:var(--ink);}
  .btn-outline:hover{ border-color:var(--accent); color:var(--accent);}

  .hero-visual{
    aspect-ratio: 4/5; border-radius:4px; position:relative; overflow:hidden;
    background: linear-gradient(155deg, var(--accent) 0%, #232920 55%, var(--paper-2) 130%);
    transition:background .5s;
  }
  .hero-visual .tag{
    position:absolute; top:22px; left:22px; background:rgba(251,250,246,.92);
    padding:10px 14px; border-radius:2px; font-family:'IBM Plex Mono',monospace;
    font-size:11px; letter-spacing:.04em; color:var(--ink);
    display:flex; flex-direction:column; gap:2px;
  }
  .hero-visual .weave{
    position:absolute; inset:0; opacity:.5;
    background-image: repeating-linear-gradient(45deg, rgba(255,255,255,.05) 0 2px, transparent 2px 10px),
                       repeating-linear-gradient(-45deg, rgba(0,0,0,.08) 0 2px, transparent 2px 10px);
  }
  .hero-stats{
    position:absolute; bottom:22px; left:22px; right:22px;
    display:flex; justify-content:space-between; color:#f4f2ea;
  }
  .hero-stats div{font-family:'IBM Plex Mono',monospace; font-size:11px;}
  .hero-stats span{ display:block; font-family:'Fraunces',serif; font-size:20px; margin-top:2px;}

  .section-head{
    display:flex; align-items:flex-end; justify-content:space-between;
    max-width:1240px; margin:0 auto; padding:0 32px 26px; gap:20px; flex-wrap:wrap;
  }
  .section-head h2{ font-size:29px; font-weight:500; margin:0; letter-spacing:-.01em;}
  .section-head .count{
    font-family:'IBM Plex Mono', monospace; font-size:12px; color:var(--muted);
  }
  section.pad{ padding:64px 0 10px;}

  .grid{
    max-width:1240px; margin:0 auto; padding: 0 32px 30px;
    display:grid; grid-template-columns:repeat(4, 1fr); gap:26px 22px;
  }
  .card{
    background:var(--card); border:1px solid var(--line); border-radius:3px;
    overflow:hidden; display:flex; flex-direction:column;
    opacity:0; transform:translateY(14px);
    animation: rise .5s ease forwards;
  }
  @keyframes rise{ to{opacity:1; transform:translateY(0);} }
  .card-media{
    aspect-ratio:3/4; position:relative; overflow:hidden;
  }
  .card-media .swatch-bg{ position:absolute; inset:0; transition:transform .5s ease;}
  .card:hover .swatch-bg{ transform:scale(1.045);}
  .card-media .texture{
    position:absolute; inset:0; mix-blend-mode:multiply; opacity:.25;
    background-image: repeating-linear-gradient(100deg, rgba(0,0,0,.12) 0 1px, transparent 1px 7px);
  }
  .badge{
    position:absolute; top:10px; left:10px; background:var(--ink); color:#fff;
    font-family:'IBM Plex Mono',monospace; font-size:9.5px; letter-spacing:.05em;
    padding:5px 8px; border-radius:2px; text-transform:uppercase;
  }
  .badge.promo{ background:var(--brass); }
  .card-tag{
    position:absolute; bottom:10px; right:10px; width:30px; height:30px;
    border-radius:50%; background:rgba(251,250,246,.9); color:var(--ink);
    display:flex; align-items:center; justify-content:center; font-size:15px;
  }
  .card-body{ padding:15px 16px 17px; display:flex; flex-direction:column; gap:8px; flex:1;}
  .card-body h3{ font-size:14.5px; font-weight:600; margin:0; letter-spacing:-.005em;}
  .swatches{ display:flex; gap:6px;}
  .swatches i{ width:13px; height:13px; border-radius:50%; display:inline-block; border:1px solid rgba(0,0,0,.15);}
  .price-row{ margin-top:auto; display:flex; align-items:baseline; gap:8px; font-family:'IBM Plex Mono',monospace;}
  .price-row .now{ font-size:15px; font-weight:500;}
  .price-row .old{ font-size:12px; color:var(--muted); text-decoration:line-through;}
  .stock{ font-size:10.5px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em;}
  .empty-state{ grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--muted); font-family:'IBM Plex Mono', monospace; font-size:13px;}
  .manifesto{
    border-top:1px solid var(--line); border-bottom:1px solid var(--line);
    margin-top:50px; padding:70px 32px;
  }
  .manifesto-grid{
    max-width:1240px; margin:0 auto; display:grid; grid-template-columns: .9fr 1.1fr; gap:60px; align-items:center;
  }
  .manifesto h2{ font-size:clamp(28px,3vw,40px); line-height:1.18; font-weight:500; margin:0;}
  .manifesto h2 .accentline{ color:var(--accent); font-style:italic; transition:color .4s;}
  .steps{ display:flex; flex-direction:column; gap:0;}
  .step{ display:flex; gap:20px; padding:20px 0; border-top:1px solid var(--line);}
  .step:last-child{border-bottom:1px solid var(--line);}
  .step .n{ font-family:'IBM Plex Mono',monospace; color:var(--brass); font-size:12px; padding-top:3px;}
  .step h4{ margin:0 0 5px; font-size:15px; font-weight:600;}
  .step p{ margin:0; font-size:13.5px; color:var(--ink-soft); line-height:1.55;}
  .newsletter{ padding:80px 32px; text-align:center;}
  .newsletter-inner{ max-width:560px; margin:0 auto;}
  .newsletter h2{ font-size:30px; font-weight:500; margin:0 0 12px;}
  .newsletter p{ color:var(--ink-soft); font-size:14.5px; margin:0 0 28px; line-height:1.6;}
  .nform{ display:flex; gap:0; border:1px solid var(--ink); border-radius:30px; overflow:hidden; padding:4px;}
  .nform input{
    flex:1; border:none; background:transparent; padding:11px 18px; font-size:14px; outline:none; font-family:'Inter',sans-serif;
  }
  .nform button{
    border:none; background:var(--ink); color:#fff; padding:11px 24px; border-radius:26px; cursor:pointer; font-size:13.5px; font-weight:500;
    transition:background .3s;
  }
  .nform button:hover{ background:var(--accent);}
  .nform-msg{ margin-top:12px; font-size:12.5px; color:var(--brass); min-height:16px; font-family:'IBM Plex Mono',monospace;}

  footer{ background:var(--ink); color:#e9e7dd; padding:64px 32px 26px;}
  .footer-grid{
    max-width:1240px; margin:0 auto; display:grid; grid-template-columns: 1.3fr repeat(4, 1fr); gap:32px; padding-bottom:46px; border-bottom:1px solid rgba(233,231,221,.14);
  }
  .footer-brand .logo{ color:#e9e7dd; margin-bottom:14px;}
  .footer-brand p{ font-size:13px; color:#a5a397; line-height:1.6; max-width:260px;}
  .fcol h5{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#8f8d80; margin:0 0 16px;}
  .fcol a{ display:block; font-size:13.5px; color:#d7d5c8; margin-bottom:11px; transition:color .2s;}
  .fcol a:hover{ color:#fff;}
  .footer-bottom{
    max-width:1240px; margin:22px auto 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;
    font-size:12px; color:#8f8d80;
  }
  .socials{ display:flex; gap:16px;}

  @media (max-width: 980px){
    nav.primary-nav{ display:none;}
    .hero-grid{ grid-template-columns:1fr;}
    .manifesto-grid{ grid-template-columns:1fr; gap:30px;}
    .grid{ grid-template-columns:repeat(2,1fr);}
    .footer-grid{ grid-template-columns: repeat(2,1fr);}
  }
  @media (max-width:560px){
    .grid{ grid-template-columns:1fr 1fr; gap:14px 12px;}
    .wrap, .header-top, .cat-strip, .hero, .section-head, .grid, .manifesto, .newsletter, footer{padding-left:18px; padding-right:18px;}
  }
  @media (prefers-reduced-motion: reduce){
    *{ animation-duration:.01ms !important; transition-duration:.01ms !important;}
  }
</style>
</head>
<body class="mode-homme">

<header>
  <div class="header-top">
    <a class="logo" href="#top"><span class="dot"></span>{{STORE_NAME}}</a>
    <nav class="primary-nav">
      <a href="#collection" data-scroll>La Collection</a>
      <a href="#manifesto" data-scroll>Notre mission</a>
      <a href="#newsletter" data-scroll>Co-création</a>
    </nav>
    <div class="header-actions">
      <div class="gender-switch" id="genderSwitch">
        <div class="thumb"></div>
        <button class="active" data-gender="homme">Homme</button>
        <button data-gender="femme">Femme</button>
      </div>
      <span class="icon-btn">&#9679;&#9679;&#9679;</span>
      <span class="icon-btn">Panier (0)</span>
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
        <div class="hero-eyebrow">Fabriqué en Union Européenne</div>
        <h1 id="heroTitle">{{HERO_TITLE}}<br><em>plus de qualité.</em></h1>
        <p class="lede" id="heroLede">{{TAGLINE}}</p>
        <div class="hero-ctas">
          <a class="btn btn-solid" href="#collection" data-scroll>Voir la collection</a>
          <a class="btn btn-outline" href="#manifesto" data-scroll>Notre méthode</a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="weave"></div>
        <div class="tag" id="heroTag">100% Coton bio<br>Fabriqué au Portugal</div>
        <div class="hero-stats">
          <div>Pièces au catalogue<span id="statPieces">0</span></div>
          <div>Note moyenne<span>4.8/5</span></div>
          <div>Garantie<span>2 ans</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="pad" id="collection">
    <div class="section-head">
      <h2 id="gridTitle">Tout voir</h2>
      <div class="count"><span id="resultCount">0</span> modèles</div>
    </div>
    <div class="grid" id="productGrid">{{PRODUCTS}}</div>
  </section>

  <section class="manifesto" id="manifesto">
    <div class="manifesto-grid">
      <h2>Trois étapes avant qu'un vêtement <span class="accentline">rejoigne le vestiaire</span>.</h2>
      <div class="steps">
        <div class="step">
          <div class="n">01</div>
          <div><h4>On co-crée avec vous</h4><p>Chaque coupe est testée et notée par des centaines de porteurs avant sa mise en production.</p></div>
        </div>
        <div class="step">
          <div class="n">02</div>
          <div><h4>On produit sur-mesure les quantités</h4><p>Aucun stock dormant : chaque pièce commandée est fabriquée pour un porteur précis.</p></div>
        </div>
        <div class="step">
          <div class="n">03</div>
          <div><h4>On répare plutôt que jeter</h4><p>Retouches, recyclage et pièces détachées : le vêtement est pensé pour vivre au-delà de sa première saison.</p></div>
        </div>
      </div>
    </div>
  </section>

  <section class="newsletter" id="newsletter">
    <div class="newsletter-inner">
      <h2>On co-crée le prochain modèle ?</h2>
      <p id="journal">Laissez votre email pour co-créer vos futures pièces préférées.</p>
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
      <a class="logo" href="#top"><span class="dot"></span>{{STORE_NAME}}</a>
      <p>Un vestiaire de pièces iconiques, fabriquées pour durer, en matières naturelles.</p>
    </div>
    <div class="fcol">
      <h5>La Marque</h5>
      <a href="#manifesto" data-scroll>Notre mission</a>
      <a href="#">Nos magasins</a>
      <a href="#">Co-création</a>
    </div>
    <div class="fcol">
      <h5>Aide</h5>
      <a href="#">Satisfait ou remboursé</a>
      <a href="#">Échanges & retours gratuits</a>
      <a href="#">Paiement sécurisé</a>
    </div>
    <div class="fcol">
      <h5>Entretien</h5>
      <a href="#">Retouches</a>
      <a href="#">Recyclage</a>
      <a href="#">Guides d'entretien</a>
    </div>
    <div class="fcol">
      <h5>Suivez-nous</h5>
      <div class="socials"><a href="#">IG</a><a href="#">YT</a><a href="#">FB</a></div>
    </div>
  </div>
  <div class="footer-bottom">
    <span>2026 © {{STORE_NAME}}. Tous droits réservés.</span>
    <span>Conditions générales · Confidentialité · Cookies</span>
  </div>
</footer>

<script>
const DATA = window.__DATA__ || { products: [], categories: [] };
let state = { gender:'homme', category:'Tout voir' };

const PALETTE = {
  "bleu marine":"#2c3a54", "noir":"#191919", "écru":"#e7dfcd", "camel":"#b98a4f",
  "gris chiné":"#9a988e", "bordeaux":"#6e2a3a", "vert olive":"#5c6b47", "blanc":"#f2f1ea",
  "brun":"#5b432c", "rouge":"#a13a2f", "sauge":"#8a9a80", "taupe":"#a08d78", "rose":"#d8a3a9"
};
function sw(name){ return PALETTE[name] || "#8b8a7e"; }

function grad(cat){
  const map = {
    "Le Denim":["#2c3a54","#0f1622"], "T-Shirts & Polos":["#c9c4b3","#87836f"],
    "Tops & T-Shirts":["#c9c4b3","#87836f"], "Chemises":["#d8d3c2","#9a988e"],
    "Chemises & Blouses":["#d8d3c2","#9a988e"], "Pulls & Sweats":["#6e2a3a","#2c1219"],
    "Pantalons":["#5b432c","#221912"], "Manteaux & Vestes":["#1a1b16","#3a3a30"],
    "Costumes":["#2c3a54","#151b26"], "Robes & Jupes":["#6e2a3a","#341018"],
    "Sport":["#3a4a3a","#151d15"], "Chaussures":["#5b432c","#2a1f16"],
    "Accessoires":["#a9855a","#3d2f1c"], "Nouveautés":["#2c3a54","#151b26"],
    "Best-Sellers":["#6e2a3a","#2c1219"]
  };
  const c = map[cat] || ["#4a4a42","#1a1b16"];
  return 'linear-gradient(150deg, ' + c[0] + ' 0%, ' + c[1] + ' 100%)';
}

const catStrip = document.getElementById('catStrip');
const grid = document.getElementById('productGrid');
const gridTitle = document.getElementById('gridTitle');
const resultCount = document.getElementById('resultCount');
const statPieces = document.getElementById('statPieces');

function renderCats(){
  catStrip.innerHTML = '';
  const cats = ['Tout voir','Nouveautés','Best-Sellers','Le Denim','T-Shirts','Chemises','Pulls','Pantalons','Manteaux','Chaussures','Accessoires'];
  cats.forEach(c=>{
    const btn = document.createElement('button');
    btn.className = 'cat-pill' + (c === state.category ? ' active' : '');
    btn.textContent = c;
    btn.addEventListener('click', ()=>{ state.category = c; renderCats(); renderGrid(); });
    catStrip.appendChild(btn);
  });
}

function renderGrid(){
  const items = state.category === 'Tout voir' ? DATA.products : DATA.products.filter(p => p.category?.includes(state.category));
  gridTitle.textContent = state.category;
  resultCount.textContent = items.length;
  if(statPieces) statPieces.textContent = DATA.products.length;
  grid.innerHTML = '';
  if(items.length === 0){
    grid.innerHTML = '<div class="empty-state">Aucune pièce pour le moment.</div>'; return;
  }
  items.forEach((p, idx)=>{
    const card = document.createElement('div');
    card.className = 'card'; card.style.animationDelay = (idx * 0.04) + 's';
    card.innerHTML = '<div class="card-media"><div class="swatch-bg" style="background:' + grad(p.category || 'T-Shirts') + '"></div><div class="texture"></div></div>' +
      '<div class="card-body"><h3>' + p.name + '</h3>' +
      '<div class="price-row"><span class="now">' + p.price + '€</span>' +
      (p.oldPrice ? '<span class="old">' + p.oldPrice + '€</span>' : '') + '</div>' +
      '<div class="stock">En stock</div></div>';
    grid.appendChild(card);
  });
}

const genderSwitch = document.getElementById('genderSwitch');
if(genderSwitch){
  genderSwitch.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const g = btn.getAttribute('data-gender');
      if(g === state.gender) return;
      state.gender = g; state.category = 'Tout voir';
      genderSwitch.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b === btn));
      document.body.classList.toggle('mode-femme', g === 'femme');
      document.body.classList.toggle('mode-homme', g === 'homme');
      renderCats(); renderGrid();
    });
  });
}

document.getElementById('nform')?.addEventListener('submit', function(e){
  e.preventDefault();
  document.getElementById('nformMsg').textContent = "Merci ! Vous recevrez nos prochains lancements en avant-première.";
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

export default {
  id: 'vestiaire',
  name: 'Vestiaire',
  storeType: 'clothes' as const,
  description: 'Design épuré mode homme/femme — tons beige et laiton',
  preview: '',
  theme: {
    fontFamily: "'Fraunces', 'Inter', sans-serif",
    bgColor: '#eeede6',
    surfaceColor: '#fbfaf6',
    textColor: '#1a1b16',
    accentColor: '#2c3a54',
    glowColor: '#a9855a',
    glowEnabled: false,
    animationEnabled: true,
    glassEnabled: false,
  },
  html,
};
