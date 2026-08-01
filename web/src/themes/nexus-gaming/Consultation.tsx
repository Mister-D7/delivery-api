import { useState, type FormEvent } from 'react';
import { useCart } from '../../context/CartContext';
import { useThemeActions } from '../ThemeRoot';

const BUDGETS = [
  'Moins de 250 000 DA',
  '250 000 – 400 000 DA',
  '400 000 – 600 000 DA',
  'Plus de 600 000 DA',
];

export function Consultation() {
  const { addItem } = useCart();
  const { openCart } = useThemeActions();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState(BUDGETS[0]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    addItem({
      id: 'consultation',
      catalogId: 'consultation',
      name: `Consultation · ${name.trim()} · ${budget}`,
      price: 0,
      imageUrl: undefined,
    });
    openCart();
  };

  return (
    <section className="hpc-consult">
      <div className="th-wrap hpc-consult-inner">
        <div className="hpc-consult-text">
          <p className="hpc-kicker">Gaming / Consulting</p>
          <h2 className="hpc-consult-title">Une idée, pas un projet ?</h2>
          <p className="hpc-consult-sub">
            Besoin d'un PC sur mesure pour le gaming, le streaming ou la création ? Décrivez votre
            budget et vos usages — notre équipe vous conseille et vous livre une config optimisée.
          </p>
          <ul className="hpc-consult-points">
            <li>Réponse sous 24 h</li>
            <li>Config sur mesure</li>
            <li>Installation & garantie</li>
          </ul>
        </div>
        <form className="hpc-form" onSubmit={submit}>
          <h3 className="hpc-form-title">Obtenir une configuration</h3>
          <label className="hpc-field">
            <span>Nom complet</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. : Amine B." />
          </label>
          <label className="hpc-field">
            <span>Téléphone</span>
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05 55 55 55 55" />
          </label>
          <label className="hpc-field">
            <span>Budget estimé</span>
            <select value={budget} onChange={(e) => setBudget(e.target.value)}>
              {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <button className="hpc-btn hpc-btn-lg" type="submit">Demander un devis</button>
        </form>
      </div>
    </section>
  );
}
