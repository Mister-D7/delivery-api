import Link from './Link';

export default function Banner({ eyebrow, title, text, to = '#catalogue', cta = 'Découvrir', id }: {
  eyebrow?: string;
  title: string;
  text?: string;
  to?: string;
  cta?: string;
  id?: string;
}) {
  return (
    <section className="th-banner" id={id}>
      <div className="th-banner-inner">
        <div className="th-banner-text">
          {eyebrow && <p className="th-eyebrow">{eyebrow}</p>}
          <h3>{title}</h3>
          {text && <p>{text}</p>}
        </div>
        <Link to={to} className="th-btn th-btn-solid">{cta}</Link>
      </div>
    </section>
  );
}
