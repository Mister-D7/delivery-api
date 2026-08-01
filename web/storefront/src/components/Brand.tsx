import { useStorefront } from '../lib/storefront';

export default function Brand() {
  const { settings } = useStorefront();
  const name = settings.storeName || 'NEXUS';
  return (
    <a href="#" className="brand">
      <span className="brand-mark"></span>
      {name}
    </a>
  );
}
