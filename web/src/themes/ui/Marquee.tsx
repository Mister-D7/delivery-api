export default function Marquee({ items = [] }: { items: string[] }) {
  if (items.length === 0) return null;
  const row = (
    <>
      {items.map((x, i) => <span key={i} className="th-mq-item">{x}</span>)}
    </>
  );
  return (
    <div className="th-marquee">
      <div className="th-mq-track">{row}{row}</div>
    </div>
  );
}
