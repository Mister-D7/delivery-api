import Link from './Link';

export default function Hero({ eyebrow, title, lede, primary, primaryTo = '#catalogue', secondary, secondaryTo }: {
  eyebrow?: string;
  title: string;
  lede?: string;
  primary?: string;
  primaryTo?: string;
  secondary?: string;
  secondaryTo?: string;
}) {
  return (
    <section className="th-hero">
      <div className="th-hero-grid">
        <div>
          {eyebrow && <p className="th-eyebrow">{eyebrow}</p>}
          <h1 className="th-hero-title">{title}</h1>
          {lede && <p className="th-lede">{lede}</p>}
          {(primary || secondary) && (
            <div className="th-ctas">
              {primary && <Link to={primaryTo} className="th-btn th-btn-solid">{primary}</Link>}
              {secondary && <Link to={secondaryTo || '#catalogue'} className="th-btn th-btn-outline">{secondary}</Link>}
            </div>
          )}
        </div>
        <div className="th-hero-visual">
          <div className="th-hero-glow" />
          <div className="th-hero-chips">
            <span className="th-chip"><i>01</i>Livraison rapide</span>
            <span className="th-chip"><i>02</i>Paiement sécurisé</span>
            <span className="th-chip"><i>03</i>Support 7/7</span>
          </div>
        </div>
      </div>
    </section>
  );
}
