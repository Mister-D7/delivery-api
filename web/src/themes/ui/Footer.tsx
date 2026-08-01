import Link from './Link';

export default function Footer({ storeName, columns = [] }: {
  storeName: string;
  columns?: { title: string; links: { label: string; to: string }[] }[];
}) {
  return (
    <footer className="th-foot">
      <div className="th-foot-grid">
        <div className="th-foot-brand">
          <a className="th-logo" href="#top"><span className="th-logo-mark" />{storeName}</a>
          <p>Livraison rapide, paiement à la réception et support dédié 7/7.</p>
        </div>
        {columns.map(col => (
          <div key={col.title} className="th-foot-col">
            <h5>{col.title}</h5>
            {col.links.map(l => <Link key={l.label} to={l.to} className="th-foot-link">{l.label}</Link>)}
          </div>
        ))}
      </div>
      <div className="th-foot-bottom">
        <span>&copy; {new Date().getFullYear()} {storeName}. Tous droits réservés.</span>
        <span>Livraison · Paiement · Support</span>
      </div>
    </footer>
  );
}
