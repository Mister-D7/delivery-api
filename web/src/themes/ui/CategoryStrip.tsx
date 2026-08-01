import type { ThemeCategory } from '../index';
import { useThemeActions } from '../ThemeRoot';

export default function CategoryStrip({ categories, label = 'Tout voir' }: {
  categories: ThemeCategory[];
  label?: string;
}) {
  const { catFilter, setCatFilter } = useThemeActions();

  return (
    <div className="th-cat-strip">
      <button
        className={'th-pill' + (catFilter === null ? ' active' : '')}
        onClick={() => setCatFilter(null)}
      >
        {label}
      </button>
      {categories.map(c => (
        <button
          key={c.id}
          className={'th-pill' + (catFilter === c.name ? ' active' : '')}
          onClick={() => setCatFilter(catFilter === c.name ? null : c.name)}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
