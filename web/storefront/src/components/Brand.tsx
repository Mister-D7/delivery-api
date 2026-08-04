import { useStorefront } from '../lib/storefront';

export default function Brand() {
  const { settings } = useStorefront();
  const name = settings.storeName || 'NEXUS';
  return (
    <a href="#" className="brand">
      <span className="brand-mark"></span>
      <span className="brand-text">
        <span className="brand-name" data-edit-text="storeName">{name}</span>
        <span className="brand-sub">Designed by DjDr</span>
      </span>
    </a>
  );
}
