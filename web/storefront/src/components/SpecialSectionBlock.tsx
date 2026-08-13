import { useStorefront } from '../lib/storefront';
import type { StorefrontVariant } from '../lib/data';
import { productsOfSpecialCategory } from '../lib/data';
import SpecialProductsGrid from './SpecialProductsGrid';

interface SpecialSectionBlockProps {
  categoryId?: string;
  title?: string;
  variant: StorefrontVariant;
  showAll?: boolean;
}

export default function SpecialSectionBlock({ categoryId, title, variant, showAll }: SpecialSectionBlockProps) {
  const { settings, products } = useStorefront();
  const cats = settings.specialCategories && settings.specialCategories.length ? settings.specialCategories : [];
  const container = variant === 'greens' ? 'container-lg' : variant === 'gaming' ? 'g-container' : 'wrap';
  const headingCls = variant === 'gaming' ? 'g-products-title' : 'section-title';

  if (cats.length === 0) {
    return (
      <section className="g-section">
        <div className={container}>
          <p className={variant === 'gaming' ? 'g-prod-empty' : 'grid-empty'}>
            Aucune catégorie spéciale pour le moment.
          </p>
        </div>
      </section>
    );
  }

  if (showAll) {
    return (
      <section className="g-section">
        <div className={container}>
          {cats.map((c) => {
            const prods = productsOfSpecialCategory(c, products);
            if (prods.length === 0) return null;
            return (
              <div key={c.id} className="ps-special-group">
                <h2 className={headingCls}>{c.name}</h2>
                <SpecialProductsGrid products={prods} variant={variant} />
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  const cat = cats.find((c) => c.id === categoryId) || cats[0];
  const prods = productsOfSpecialCategory(cat, products);
  return (
    <section className="g-section">
      <div className={container}>
        <h2 className={headingCls}>{title?.trim() || cat.name}</h2>
        <SpecialProductsGrid products={prods} variant={variant} />
      </div>
    </section>
  );
}
