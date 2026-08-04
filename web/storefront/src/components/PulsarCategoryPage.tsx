import PulsarProductGrid from './PulsarProductGrid';

export default function PulsarCategoryPage({ name }: { name?: string }) {
  return (
    <>
      <span className="eyebrow">Catégorie</span>
      <h2 className="section-title cat-page-title">{name}</h2>
      <p className="section-desc cat-page-desc">
        Filtré sur « {name} » — retirez le filtre pour voir tous les produits, et triez par prix.
      </p>
      <PulsarProductGrid initialFilter={name} />
    </>
  );
}
