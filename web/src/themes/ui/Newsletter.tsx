import { useState } from 'react';

export default function Newsletter({ title = 'Ne ratez rien', text = 'Recevez nos nouveautés et promos en avant-première.', button = 'Rejoindre' }: {
  title?: string;
  text?: string;
  button?: string;
}) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <section className="th-newsletter">
      <div className="th-news-inner">
        <h3>{title}</h3>
        <p>{text}</p>
        <form
          className="th-nform"
          onSubmit={e => { e.preventDefault(); if (email.trim()) { setSent(true); setEmail(''); } }}
        >
          <input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit">{button}</button>
        </form>
        <div className="th-nmsg">{sent ? 'Merci — vous êtes inscrit(e).' : ''}</div>
      </div>
    </section>
  );
}
