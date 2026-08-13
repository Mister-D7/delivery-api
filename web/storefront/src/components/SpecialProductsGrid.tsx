import type { Product, StorefrontVariant } from '../lib/data';
import GamingProductCard from './GamingProductCard';
import PulsarProductCard from './PulsarProductCard';
import OrganicProductCard from './OrganicProductCard';

export default function SpecialProductsGrid({ products, variant }: { products: Product[]; variant: StorefrontVariant }) {
  return (
    <div className={variant === 'gaming' ? 'g-prod-grid' : 'grid'}>
      {products.map((p) => {
        if (variant === 'gaming') return <GamingProductCard key={p.id} p={p} />;
        if (variant === 'pulsar') return <PulsarProductCard key={p.id} p={p} />;
        return <OrganicProductCard key={p.id} p={p} />;
      })}
      {products.length === 0 && (
        <p className={variant === 'gaming' ? 'g-prod-empty' : 'grid-empty'}>
          Aucun produit dans cette catégorie spéciale pour le moment.
        </p>
      )}
    </div>
  );
}
