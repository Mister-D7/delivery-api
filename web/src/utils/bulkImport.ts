export type BulkImportItem = {
  name?: string;
  category?: string;
  imageUrl?: string;
  salePrice?: number;
  costPrice?: number;
  stockQty?: number;
  description?: string;
  specs?: string;
};

function toNum(v: string | undefined): number | undefined {
  if (v == null) return undefined;
  const cleaned = String(v).replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

export function parseImportText(text: string): BulkImportItem[] {
  const lines = text.split(/\r?\n/);
  const items: BulkImportItem[] = [];
  let cur: BulkImportItem | null = null;

  const setField = (key: string, value: string) => {
    const k = key.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[:_]+$/g, '').trim();
    const v = value.trim();
    if (!cur) cur = {};
    if (k === 'product' || k === 'name' || k === 'productname' || k === 'product name' || k === 'nom' || k === 'produit') cur.name = v;
    else if (k === 'category' || k === 'categorie' || k === 'catégorie') cur.category = v;
    else if (k === 'image' || k === 'imageurl' || k === 'image url' || k === 'photo' || k === 'link' || k === 'lien' || k === 'url') cur.imageUrl = v;
    else if (k === 'price buy' || k === 'buy' || k === 'cost' || k === 'costprice' || k === 'cost price' || k === "prix d'achat" || k === 'prix achat' || k === 'prix d achat' || k === 'achat' || k === 'pricebuy') cur.costPrice = toNum(v);
    else if (k === 'price sell' || k === 'sell' || k === 'sale' || k === 'saleprice' || k === 'sale price' || k === 'price' || k === 'prix' || k === 'prix de vente' || k === 'prix vente' || k === 'vente' || k === 'pricesell') cur.salePrice = toNum(v);
    else if (k === 'stock' || k === 'stockqty' || k === 'stock qty' || k === 'quantity' || k === 'qty' || k === 'quantite' || k === 'quantité') cur.stockQty = toNum(v);
    else if (k === 'description' || k === 'desc' || k === 'description') cur.description = v;
    else if (k === 'specs' || k === 'caracteristiques' || k === 'caractéristiques' || k === 'caractéristique') cur.specs = v;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^product\s*:/i.test(line) || /^produit\s*:/i.test(line)) {
      if (cur && cur.name) items.push(cur);
      cur = {};
      const val = line.replace(/^[^:]+:\s*/, '');
      setField('product', val);
      continue;
    }
    if (cur) {
      const idx = line.indexOf(':');
      if (idx > 0) setField(line.slice(0, idx), line.slice(idx + 1));
    }
  }
  if (cur && cur.name) items.push(cur);

  if (items.length === 0) {
    const headerLine = lines.find(l => /product/i.test(l) && l.includes(','));
    if (headerLine) {
      const headerIdx = lines.indexOf(headerLine);
      const h = headerLine.split(',').map(s => s.trim().toLowerCase());
      const nameIdx = h.findIndex(s => s === 'product' || s === 'name');
      if (nameIdx >= 0) {
        for (const raw of lines.slice(headerIdx + 1)) {
          if (!raw.trim()) continue;
          const cols = raw.split(',').map(s => s.trim());
          if (cols.filter(Boolean).length === 0) continue;
          const findIdx = (names: string[]) => {
            for (const n of names) { const i = h.indexOf(n); if (i >= 0) return i; }
            return undefined;
          };
          const item: BulkImportItem = { name: cols[nameIdx] };
          const catI = findIdx(['category', 'categorie', 'catégorie']);
          const imgI = findIdx(['image', 'imageurl', 'image url', 'photo', 'url']);
          const costI = findIdx(['cost', 'costprice', 'cost price', 'pricebuy', 'price buy', 'buy', 'achat']);
          const sellI = findIdx(['price', 'saleprice', 'sale price', 'pricesell', 'price sell', 'sell', 'prix', 'vente']);
          const stockI = findIdx(['stock', 'stockqty', 'stock qty', 'qty', 'quantity']);
          const descI = findIdx(['description', 'desc']);
          if (catI != null) item.category = cols[catI];
          if (imgI != null) item.imageUrl = cols[imgI];
          if (costI != null) item.costPrice = toNum(cols[costI]);
          if (sellI != null) item.salePrice = toNum(cols[sellI]);
          if (stockI != null) item.stockQty = toNum(cols[stockI]);
          if (descI != null) item.description = cols[descI];
          if (item.name) items.push(item);
        }
      }
    }
  }

  return items.filter(i => i.name);
}
