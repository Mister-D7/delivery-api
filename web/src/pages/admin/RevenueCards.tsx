import { useState, useEffect, useRef } from 'react';
import { EyeOff, GripVertical } from '../../components/adminIcons';
import type { Overview, CardDef } from './revenueTypes';
import { loadLayout, saveLayout, loadHidden, saveHidden } from './revenueUtils';

type Props = {
  overview: Overview;
  getCardDefs: (o: Overview) => CardDef[];
  allCardIds: string[];
};

export default function RevenueCards({ overview, getCardDefs, allCardIds }: Props) {
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [hiddenCards, setHiddenCards] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    const saved = loadLayout();
    if (saved) setCardOrder(saved);
    else setCardOrder(allCardIds);
    setHiddenCards(loadHidden());
    setReady(true);
  }, [allCardIds]);

  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragEnter = (idx: number) => { dragOverItem.current = idx; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newOrder = [...cardOrder];
    const dragged = newOrder.splice(dragItem.current, 1)[0];
    newOrder.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null;
    dragOverItem.current = null;
    setCardOrder(newOrder);
    saveLayout(newOrder);
  };

  const toggleCard = (id: string) => {
    const next = hiddenCards.includes(id) ? hiddenCards.filter(c => c !== id) : [...hiddenCards, id];
    setHiddenCards(next);
    saveHidden(next);
  };

  if (!ready) return null;

  const defs = getCardDefs(overview);
  const ordered = cardOrder.map(id => defs.find(d => d.id === id)).filter(Boolean) as CardDef[];
  const visible = ordered.filter(c => !hiddenCards.includes(c.id));
  const hidden = ordered.filter(c => hiddenCards.includes(c.id));

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-3">
        {hidden.map(c => (
          <button key={c.id} onClick={() => toggleCard(c.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-semibold transition-all"
            style={{ background: 'var(--admin-border2)', color: 'var(--admin-muted)', border: '1px dashed var(--admin-border2)' }}>
            <EyeOff size={10} /> {c.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {visible.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.id} className="surface-card p-4 relative group" draggable onDragStart={() => handleDragStart(cardOrder.indexOf(c.id))} onDragEnter={() => handleDragEnter(cardOrder.indexOf(c.id))} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()} style={{ cursor: 'grab', transition: 'transform 0.15s' }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--admin-muted)' }}>{c.label}</p>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical size={10} style={{ color: 'var(--admin-muted2)', cursor: 'grab' }} />
                  <button onClick={(e) => { e.stopPropagation(); toggleCard(c.id); }} className="p-0.5 rounded" style={{ color: 'var(--admin-muted2)' }}>
                    <EyeOff size={10} />
                  </button>
                </div>
              </div>
              <p className="text-lg font-bold" style={{ color: c.color }}>{c.value}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
