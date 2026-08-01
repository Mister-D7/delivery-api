import { useStorefront } from '../lib/storefront';

const ICONS: [RegExp, string][] = [
  [/jeu|game|play|console|playstation|xbox|switch/i, '🎮'],
  [/télé|phone|smart|mobile|samsung|iphone/i, '📱'],
  [/charge|power|batterie|chargeur/i, '⚡'],
  [/pc|ordinateur|laptop|portable|écran|gaming pc/i, '💻'],
  [/écoute|audio|casque|enceinte/i, '🎧'],
  [/vêt|mode|chemise|t-shirt|robe|chaussure/i, '👕'],
  [/livre|book/i, '📚'],
];

function iconFor(name: string): string {
  for (const [re, ic] of ICONS) if (re.test(name)) return ic;
  return '🛒';
}

export default function PulsarCategories() {
  const { categories } = useStorefront();
  const cats = categories.length ? categories.slice(0, 4) : ['Jeux vidéo', 'Accessoires', 'Téléphones', 'PC'];
  return (
    <div className="cat-grid" id="catGrid">
      {cats.map((name) => (
        <a key={name} href="#shop" className="cat-card" data-tilt>
          <div className="cat-icon">{iconFor(name)}</div>
          <div>
            <h3>{name}</h3>
            <p>VOIR LA COLLECTION</p>
          </div>
          <span className="cat-arrow">↗</span>
        </a>
      ))}
    </div>
  );
}
