import type { ThemeData } from '../index';
import {
  Header,
  Hero,
  Marquee,
  CategoryStrip,
  ProductGrid,
  Banner,
  Stats,
  Newsletter,
  Footer,
} from './index';

export default function DefaultPage({ storeName, tagline, bannerText, products, categories }: ThemeData) {
  return (
    <>
      <Header
        storeName={storeName}
        links={[
          { label: 'Catalogue', to: '#catalogue' },
          { label: 'Promos', to: '#promo' },
          { label: 'Suivi de commande', to: '/track' },
          { label: 'Compte', to: '/auth/login' },
        ]}
      />

      <Hero
        eyebrow="Votre boutique en ligne"
        title={bannerText}
        lede={tagline}
        primary="Voir le catalogue"
        primaryTo="#catalogue"
        secondary="Suivre ma commande"
        secondaryTo="/track"
      />

      <Marquee items={[
        'Livraison rapide',
        'Paiement à la livraison',
        'Support 7/7',
        'Qualité garantie',
      ]} />

      <CategoryStrip categories={categories} />

      <ProductGrid title="Tout voir" products={products} columns={4} />

      <Banner
        id="promo"
        eyebrow="Offre spéciale"
        title="Jusqu'à -30% sur une sélection"
        text="Profitez-en avant la fin du stock."
        to="#catalogue"
        cta="En profiter"
      />

      <Stats items={[
        { value: 'Rapide', label: 'Livraison' },
        { value: '4.9/5', label: 'Note clients' },
        { value: '7/7', label: 'Support' },
        { value: '100%', label: 'Paiement à la livraison' },
      ]} />

      <Newsletter
        title="Restez informé"
        text="Nouveautés et offres exclusives — un email par semaine, jamais plus."
        button="Rejoindre"
      />

      <Footer
        storeName={storeName}
        columns={[
          {
            title: 'Boutique',
            links: [
              { label: 'Catalogue complet', to: '#catalogue' },
              { label: 'Promos', to: '#promo' },
              { label: 'Panier', to: 'cart' },
            ],
          },
          {
            title: 'Compte',
            links: [
              { label: 'Se connecter', to: '/auth/login' },
              { label: 'Créer un compte', to: '/auth/register' },
              { label: 'Mes commandes', to: '/track' },
            ],
          },
          {
            title: 'Aide',
            links: [
              { label: 'Suivi de commande', to: '/track' },
              { label: 'Paiement sécurisé', to: '/checkout' },
              { label: 'Retour à la boutique', to: '/' },
            ],
          },
        ]}
      />
    </>
  );
}
