export default function Stats({ items = [] }: { items: { value: string; label: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="th-stats">
      {items.map(s => (
        <div key={s.label} className="th-stat">
          <div className="th-stat-value">{s.value}</div>
          <div className="th-stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
