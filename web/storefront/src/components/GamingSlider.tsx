import { useMemo } from 'react';
import { useStorefront } from '../lib/storefront';
import type { Product } from '../lib/data';
import HScroll from './HScroll';
import GamingProductCard from './GamingProductCard';

export default function GamingSlider({
  configKey,
  titleKey,
  title,
}: {
  configKey: string;
  titleKey: string;
  title: string;
}) {
  const { products, settings } = useStorefront();
  const texts = (settings.texts ?? {}) as Record<string, string>;
  const selected = (settings as any)[configKey];

  const shown = useMemo(() => {
    if (Array.isArray(selected) && selected.length) {
      const list = selected
        .map((id: string) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p));
      if (list.length) return list;
    }
    return products.slice(0, 8);
  }, [products, selected]);

  if (!shown.length) return null;

  return (
    <section className="g-slider-section" data-edit-slider={configKey}>
      <h2 className="g-products-title" data-edit-text={titleKey} data-text-key={titleKey}>
        {texts[titleKey] || title}
      </h2>
      <HScroll className="g-slider" ariaLabel={title}>
        {shown.map((p) => (
          <div className="g-slider-item" key={p.id}>
            <GamingProductCard p={p} />
          </div>
        ))}
      </HScroll>
    </section>
  );
}
