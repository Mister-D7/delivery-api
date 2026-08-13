import type { FormEvent } from 'react';
import { useStorefront } from '../lib/storefront';
import type { PageSection, SliderSection, SpecialSection, StorefrontVariant } from '../lib/data';
import { defaultPageSections } from '../lib/data';
import SliderBlock from './SliderBlock';
import SpecialSectionBlock from './SpecialSectionBlock';
import PulsarCategories from './PulsarCategories';
import OrganicProductGrid from './OrganicProductGrid';
import CombosSection from './CombosSection';
import GamingCategories from './GamingCategories';
import GamingSlider from './GamingSlider';
import GamingProductGrid from './GamingProductGrid';
import PulsarProductGrid from './PulsarProductGrid';
import PulsarSpotlight from './PulsarSpotlight';
import PulsarSpotlightScene from './PulsarSpotlightScene';
import PulsarHero from './PulsarHero';
import PulsarHeroScene from './PulsarHeroScene';

type Variant = StorefrontVariant;

const WIDTH_CLASS: Record<string, string> = {
  full: 'ps-col-full',
  'three-quarters': 'ps-col-three-quarters',
  'two-thirds': 'ps-col-two-thirds',
  half: 'ps-col-half',
  third: 'ps-col-third',
  quarter: 'ps-col-quarter',
};

const GAMING_PROMOS_BIG = [
  { id: 'pulsar-deals', img: '/images/gaming/pulsar-frontpage-eol-deals-maxgaming.webp', alt: 'Pulsar Gaming Deals' },
  { id: 'libernova', img: '/images/gaming/libernova-frontpage-banner-large-v2.webp', alt: 'Libernova' },
  { id: 'feinmann', img: '/images/gaming/Feinmann-F01-Noctua-mini-banner.webp', alt: 'Feinmann F01 Noctua' },
];
const GAMING_PROMOS_MED = [
  { id: 'back2school', img: '/images/gaming/Back-2-School-2026.png', alt: 'Retour aux études' },
  { id: 'gamesir', img: '/images/gaming/gamesir-mini-frontpage-banner-maxgaming.webp', alt: 'Gamesir' },
  { id: 'maxmount', img: '/images/gaming/maxmount-mini-maxgaming-banner-v2.png', alt: 'MaxMount' },
];

function FeaturesStrip() {
  return (
    <section className="container-lg">
      <div className="row row-cols-1 row-cols-md-3 g-0 my-4 rounded-3 overflow-hidden shadow-sm">
        <div className="col bg-primary text-light p-4">
          <div className="og-feature">
            <span className="og-feature-icon">🌱</span>
            <div>
              <h5 data-edit-text="feature_1_title" data-text-key="feature_1_title">Fresh from farm</h5>
              <p data-edit-text="feature_1_desc" data-text-key="feature_1_desc">Des fruits et légumes frais, directement de la ferme.</p>
            </div>
          </div>
        </div>
        <div className="col bg-secondary text-light p-4">
          <div className="og-feature">
            <span className="og-feature-icon">🌿</span>
            <div>
              <h5 data-edit-text="feature_2_title" data-text-key="feature_2_title">100% Organic</h5>
              <p data-edit-text="feature_2_desc" data-text-key="feature_2_desc">Une sélection 100% bio et naturelle.</p>
            </div>
          </div>
        </div>
        <div className="col bg-danger text-light p-4">
          <div className="og-feature">
            <span className="og-feature-icon">🚚</span>
            <div>
              <h5 data-edit-text="feature_3_title" data-text-key="feature_3_title">Free delivery</h5>
              <p data-edit-text="feature_3_desc" data-text-key="feature_3_desc">Livraison rapide, offerte dès 5 000 DA.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GreensCategories() {
  return (
    <section id="shop" className="container-lg py-5" data-sec-categories>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <span className="eyebrow" data-edit-text="eyebrow-categories" data-text-key="eyebrow-categories">Browse by category</span>
          <h2 className="section-title mt-1" data-edit-text="title-categories" data-text-key="title-categories">Category</h2>
        </div>
        <a href="/#lineup" className="btn btn-primary rounded-pill px-4">View All</a>
      </div>
      <PulsarCategories />
    </section>
  );
}

function GreensProducts() {
  return (
    <section id="lineup" className="container-lg pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <span className="eyebrow" data-edit-text="eyebrow-lineup" data-text-key="eyebrow-lineup">The lineup</span>
          <h2 className="section-title mt-1" data-edit-text="title-lineup" data-text-key="title-lineup">Best selling products</h2>
        </div>
        <a href="/#shop" className="btn btn-outline-secondary rounded-pill px-4">Shop All</a>
      </div>
      <OrganicProductGrid />
    </section>
  );
}

function GreensBanners() {
  return (
    <section id="featured" className="container-lg py-4">
      <div className="banner-blocks">
        <div className="banner-block" style={{ backgroundImage: 'url(/images/banner-ad-1.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 250 }}>
          <div className="banner-content">
            <h3>Items on SALE</h3>
            <p>Discounts up to 30%</p>
            <a href="/#lineup" className="btn btn-light btn-sm rounded-pill px-4">Shop Now</a>
          </div>
        </div>
        <div className="banner-block" style={{ backgroundImage: 'url(/images/banner-ad-2.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 250 }}>
          <div className="banner-content">
            <h3>Combo offers</h3>
            <p>Discounts up to 50%</p>
            <a href="/#combos" className="btn btn-light btn-sm rounded-pill px-4">Découvrir</a>
          </div>
        </div>
        <div className="banner-block" style={{ backgroundImage: 'url(/images/banner-ad-3.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 250 }}>
          <div className="banner-content">
            <h3>Discount Coupons</h3>
            <p>Discounts up to 40%</p>
            <a href="/#lineup" className="btn btn-light btn-sm rounded-pill px-4">Shop Now</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function GamingPromosBlock() {
  return (
    <section className="g-promos" id="promos">
      <div className="g-container">
        <div className="g-promo-row g-promo-big">
          {GAMING_PROMOS_BIG.map(b => (
            <div className="g-promo" key={b.id} data-edit-banner data-banner={b.id}>
              <a className="g-promo-card" href="#products"><img src={b.img} alt={b.alt} loading="lazy" /></a>
            </div>
          ))}
        </div>
        <div className="g-promo-row g-promo-med">
          {GAMING_PROMOS_MED.map(b => (
            <div className="g-promo" key={b.id} data-edit-banner data-banner={b.id}>
              <a className="g-promo-card" href="#products"><img src={b.img} alt={b.alt} loading="lazy" /></a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GamingAbout() {
  return (
    <section className="g-about" id="about">
      <h1 data-edit-text="aboutTitle" data-text-key="aboutTitle">La référence gaming en Algérie</h1>
      <p data-edit-text="aboutText" data-text-key="aboutText">
        Pulsar Gaming est la destination n°1 des gamers en Algérie : consoles, manettes,
        casques, claviers, souris, chaises gaming et composants — livrés partout en Algérie
        avec paiement à la livraison.
      </p>
    </section>
  );
}

function PulsarMarquee() {
  return (
    <div className="marquee">
      <div className="marquee-track" data-edit-text="marquee" data-text-key="marquee">
        {['Paiement à la livraison', 'Garantie 12 mois', 'Support 7/7', 'Charge rapide', 'Retour sous 14 jours'].map(t => (
          <span key={t}>{t}</span>
        ))}
        {['Paiement à la livraison', 'Garantie 12 mois', 'Support 7/7', 'Charge rapide', 'Retour sous 14 jours'].map(t => (
          <span key={`b-${t}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function PulsarCategoriesSection() {
  return (
    <section id="shop" className="" data-sec-categories>
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow" data-edit-text="eyebrow-categories" data-text-key="eyebrow-categories">Acheter par catégorie</span>
            <h2 className="section-title" data-edit-text="title-categories" data-text-key="title-categories">Quatre familles. <span className="accent">Un écosystème.</span></h2>
          </div>
          <p className="section-desc" data-edit-text="desc-categories" data-text-key="desc-categories">Chaque appareil partage le même standard de charge rapide — plus jamais de bagarre de câbles.</p>
        </div>
        <PulsarCategories />
      </div>
    </section>
  );
}

function PulsarSpotlightSection() {
  return (
    <section id="featured">
      <div className="wrap">
        <div className="spotlight" data-edit-vedette>
          <PulsarSpotlight />
          <PulsarSpotlightScene />
        </div>
      </div>
    </section>
  );
}

function PulsarLineupSection() {
  return (
    <section id="lineup">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow" data-edit-text="eyebrow-lineup" data-text-key="eyebrow-lineup">La gamme</span>
            <h2 className="section-title" data-edit-text="title-lineup" data-text-key="title-lineup">Tout au <span className="accent">même endroit</span></h2>
          </div>
          <p className="section-desc" data-edit-text="desc-lineup" data-text-key="desc-lineup">Filtrez par catégorie — chaque produit est livré chargé et prêt à être associé.</p>
        </div>
        <PulsarProductGrid />
      </div>
    </section>
  );
}

function PulsarWhySection() {
  return (
    <section>
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow" data-edit-text="eyebrow-why" data-text-key="eyebrow-why">Pourquoi PULSAR</span>
            <h2 className="section-title" data-edit-text="title-why" data-text-key="title-why">Conçu comme <span className="accent">un seul système</span></h2>
          </div>
        </div>
        <div className="features">
          <div className="feature"><span className="feature-num">01</span><h4 data-edit-text="feature-title-1" data-text-key="feature-title-1">Charge rapide partagée</h4><p data-edit-text="feature-desc-1" data-text-key="feature-desc-1">Chaque appareil — des écouteurs à l'ordinateur — se charge sur le même standard, un seul chargeur suffit.</p></div>
          <div className="feature"><span className="feature-num">02</span><h4 data-edit-text="feature-title-2" data-text-key="feature-title-2">Passerelle entre appareils</h4><p data-edit-text="feature-desc-2" data-text-key="feature-desc-2">Appels, médias et presse-papiers passent instantanément entre votre téléphone, vos écouteurs et votre ordinateur.</p></div>
          <div className="feature"><span className="feature-num">03</span><h4 data-edit-text="feature-title-3" data-text-key="feature-title-3">Batterie qui dure</h4><p data-edit-text="feature-desc-3" data-text-key="feature-desc-3">Autonomies testées en conditions réelles, pas des chiffres de laboratoire.</p></div>
        </div>
      </div>
    </section>
  );
}

function PulsarStats() {
  return (
    <div className="stats">
      <div className="stat"><div className="stat-num" data-edit-text="stat-num-1" data-text-key="stat-num-1">1200+</div><div className="stat-label" data-edit-text="stat-label-1" data-text-key="stat-label-1">Configs livrées</div></div>
      <div className="stat"><div className="stat-num" data-edit-text="stat-num-2" data-text-key="stat-num-2">4.9/5</div><div className="stat-label" data-edit-text="stat-label-2" data-text-key="stat-label-2">Note clients</div></div>
      <div className="stat"><div className="stat-num" data-edit-text="stat-num-3" data-text-key="stat-num-3">24/48h</div><div className="stat-label" data-edit-text="stat-label-3" data-text-key="stat-label-3">Livraison</div></div>
      <div className="stat"><div className="stat-num" data-edit-text="stat-num-4" data-text-key="stat-num-4">7/7</div><div className="stat-label" data-edit-text="stat-label-4" data-text-key="stat-label-4">Support</div></div>
    </div>
  );
}

function Newsletter({ variant }: { variant: Variant }) {
  const onSub = (e: FormEvent) => {
    e.preventDefault();
    const b = (e.currentTarget as HTMLFormElement).querySelector('button');
    if (b) b.textContent = 'Inscrit ✓';
  };
  if (variant === 'gaming') {
    return (
      <section className="g-newsletter">
        <h3 data-edit-text="newsletterTitle" data-text-key="newsletterTitle">Ne ratez aucun drop</h3>
        <p data-edit-text="newsletterText" data-text-key="newsletterText">Nouvelles sorties, restocks et offres exclusives — directement dans votre boîte mail.</p>
        <form onSubmit={onSub}>
          <input type="email" placeholder="Votre adresse email" required />
          <button type="submit">S'inscrire</button>
        </form>
      </section>
    );
  }
  return (
    <section className="newsletter">
      <div className="wrap">
        <span className="eyebrow">Restez branché</span>
        <h2>Accès anticipé aux nouveautés</h2>
        <p>Nouveaux produits, restocks et prix membres — directement dans votre boîte mail.</p>
        <form className="newsletter-form" onSubmit={onSub}>
          <input type="email" placeholder="Votre adresse email" required />
          <button type="submit" className="btn btn-solid">S'inscrire</button>
        </form>
      </div>
    </section>
  );
}

function PulsarHeroSection() {
  return (
    <section className="hero">
      <PulsarHeroScene />
      <div className="hero-content">
        <PulsarHero />
        <div className="hero-ctas">
          <a href="#shop" className="btn btn-solid">Découvrir la gamme</a>
          <a href="#featured" className="btn btn-outline">Voir en 3D</a>
        </div>
      </div>
      <div className="scroll-cue"><span>Scroll</span><span className="line"></span></div>
    </section>
  );
}

function SectionLabel({ kind }: { kind: string }) {
  const labels: Record<string, string> = {
    features: 'Avantages',
    banners: 'Bannières',
    categories: 'Catégories',
    products: 'Produits',
    combos: 'Combos',
    promos: 'Promos',
    popular: 'Populaires',
    recommended: 'Recommandés',
    about: 'À propos',
    spotlight: 'Vedette',
    marquee: 'Bandeau défilant',
    why: 'Pourquoi nous',
    stats: 'Statistiques',
    newsletter: 'Newsletter',
    hero: 'Hero',
    special: 'Catégorie spéciale',
  };
  return <>{labels[kind] || kind}</>;
}

export default function PageSections({ variant }: { variant: Variant }) {
  const { settings } = useStorefront();
  const container = variant === 'greens' ? 'container-lg' : variant === 'gaming' ? 'g-container' : 'wrap';
  const list: PageSection[] = settings.sections && settings.sections.length ? settings.sections : defaultPageSections(variant);

  return (
    <div className="ps-body">
      {list.map((sec, i) => {
        if (sec.kind === 'slider') {
          const s = sec as SliderSection;
          const isHero = s.hero || (i === 0 && sec.kind === 'slider');
          return (
            <section className={`ps-zone ps-slider${isHero ? ' ps-slider-hero' : ''}`} key={sec.id}>
              <div className={isHero ? 'ps-full' : container}>
                <div className="ps-row">
                  <div
                    className={WIDTH_CLASS[s.width || 'full'] || 'ps-col-custom'}
                    style={s.width === 'custom' ? { flex: `0 0 ${Math.min(100, Math.max(10, s.widthPct ?? 50))}%` } : undefined}
                  >
                    <SliderBlock section={{ ...s, hero: isHero }} />
                  </div>
                </div>
              </div>
            </section>
          );
        }
        const kind = sec.kind;
        const content = (() => {
          if (kind === 'special') {
            const sp = sec as SpecialSection;
            return <SpecialSectionBlock categoryId={sp.categoryId} title={sp.title} variant={variant} />;
          }
          if (variant === 'greens') {
            if (kind === 'features') return <FeaturesStrip />;
            if (kind === 'categories') return <GreensCategories />;
            if (kind === 'products') return <GreensProducts />;
            if (kind === 'combos') return <section id="combos" className="container-lg py-4"><CombosSection /></section>;
            if (kind === 'banners') return <GreensBanners />;
          }
          if (variant === 'gaming') {
            if (kind === 'promos') return <GamingPromosBlock />;
            if (kind === 'categories') return <section className="g-section" data-sec-categories><GamingCategories /></section>;
            if (kind === 'popular') return <GamingSlider configKey="popularProductIds" titleKey="popularTitle" title="Popular products" />;
            if (kind === 'recommended') return <GamingSlider configKey="recommendedProductIds" titleKey="recommendedTitle" title="Recommended products" />;
            if (kind === 'products') return <GamingProductGrid />;
            if (kind === 'about') return <GamingAbout />;
            if (kind === 'newsletter') return <Newsletter variant={variant} />;
          }
          if (variant === 'pulsar') {
            if (kind === 'hero') return <PulsarHeroSection />;
            if (kind === 'marquee') return <PulsarMarquee />;
            if (kind === 'categories') return <PulsarCategoriesSection />;
            if (kind === 'spotlight') return <PulsarSpotlightSection />;
            if (kind === 'products') return <PulsarLineupSection />;
            if (kind === 'why') return <PulsarWhySection />;
            if (kind === 'stats') return <PulsarStats />;
            if (kind === 'newsletter') return <Newsletter variant={variant} />;
          }
          return null;
        })();
        if (!content) return null;
        return (
          <section className="ps-zone" key={sec.id} data-edit-sec={sec.id} data-sec-kind={kind}>
            {content}
          </section>
        );
      })}
    </div>
  );
}
