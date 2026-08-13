import { useEffect, useState } from 'react';
import { useStorefront } from '../lib/storefront';
import { addItem, openCart } from '../lib/cart';
import { PREORDER_PRODUCT, preorderPrice, preorderStrike, preorderTiming, formatMoney } from '../lib/preorder';
import PreorderThree from './PreorderThree';
import PreorderCountdown from './PreorderCountdown';
import PreorderInterest from './PreorderInterest';

function Padlock() {
  return (
    <svg className="po-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function Zap() {
  return (
    <svg className="po-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

export default function PreorderLanding() {
  const { settings } = useStorefront();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const price = preorderPrice(settings);
  const strike = preorderStrike(settings);
  const timing = preorderTiming(settings, now);
  const upcoming = timing.status === 'upcoming';
  const live = timing.status === 'live';
  const ended = timing.status === 'ended';

  const order = () => {
    if (!live) return;
    addItem({ ...PREORDER_PRODUCT, price });
    openCart();
  };

  const heroBadge = upcoming ? 'L’offre commence dans' : live ? 'L’offre se termine après' : 'Offre terminée';

  return (
    <div className="po-root">
      <PreorderThree />

      {/* Nav */}
      <nav className="po-nav">
        <div className="po-container po-nav-inner">
          <div className="po-brand">
            <span className="po-brand-name">Mister-D</span>
            <span className="po-brand-sub">· Software Engineering</span>
          </div>
          <div className="po-nav-right">
            <span className="po-version">v2.0 · ecosystem</span>
            <a href="#preorder" className="po-pill-link">Pré‑commander</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="po-hero">
        <div className="po-container po-hero-grid">
          <div className="po-hero-left po-fade-in">
            <div className="po-pill">
              <span className="po-pulse-dot" />
              Un écosystème · software engineering
            </div>
            <h1 className="po-title">
              Pré‑commander pour accéder à la{' '}
              <span className="po-grad-text">pleine puissance</span>
              d’un écosystème
            </h1>
            <p className="po-sub">
              Un écosystème · software engineering — conçu pour ceux qui exigent précision, échelle et intelligence.
            </p>
            <div className="po-hero-actions">
              <a href="#preorder" className="po-btn po-btn-primary">
                <Zap /> Pré‑commander
              </a>
              <a href="#features" className="po-btn po-btn-outline">
                Explorer
                <svg className="po-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
            <div className="po-interested">
              <div className="po-avatars">
                <span className="po-avatar a1">JD</span>
                <span className="po-avatar a2">AK</span>
                <span className="po-avatar a3">MR</span>
                <span className="po-avatar a4">+</span>
              </div>
              <span className="po-interested-text">
                <strong><PreorderInterest /></strong> personnes intéressées
              </span>
            </div>
          </div>

          <div className="po-hero-right po-fade-in po-delay-2">
            <div className="po-orb po-orb-blue" />
            <div className="po-orb po-orb-purple" />
            <div className="po-card po-float">
              <div className="po-card-head">
                <span className="po-card-label">prix de pré‑commande</span>
                <span className="po-promo">promo</span>
              </div>
              <div className="po-card-price">
                <span className="po-price">{formatMoney(price)}</span>
                <span className="po-strike">{formatMoney(strike)}</span>
              </div>
              <div className="po-card-countdown">
                <svg className="po-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{heroBadge}&nbsp;<PreorderCountdown target={upcoming ? timing.start : timing.end} now={now} compact /></span>
              </div>
              <div className="po-glow-line" />
              <div className="po-card-foot">
                <span><PreorderInterest /> intéressés</span>
                <span className="po-dot">·</span>
                <span>{upcoming ? '15 jours' : live ? 'fenêtre ouverte' : 'terminé'}</span>
              </div>
            </div>
            <div className="po-ring" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="po-features">
        <div className="po-container">
          <div className="po-features-head po-fade-in">
            <div className="po-kicker">modules de l’écosystème</div>
            <h2 className="po-features-title">Trois piliers. Un <span className="po-grad-text">moteur</span>.</h2>
            <p className="po-features-sub">Pré‑commander débloque toute la stack — déployez, pilotez et sécurisez avec intelligence.</p>
          </div>
          <div className="po-feature-grid po-fade-in po-delay-3">
            <div className="po-feature">
              <div className="po-feature-icon ic-blue">
                <svg className="po-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  <path d="M10 10l2 2m0 0l2-2m-2 2v4" />
                </svg>
              </div>
              <h3 className="po-feature-title">ERP</h3>
              <p className="po-feature-text">Enterprise Resource Planning — unifiez finance, opérations et équipes dans une couche temps réel.</p>
              <div className="po-feature-tag tag-blue"><span className="po-tag-dot db" />Intelligence intégrée</div>
            </div>
            <div className="po-feature">
              <div className="po-feature-icon ic-green">
                <svg className="po-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  <path d="M9 16l3 3 6-6" />
                </svg>
              </div>
              <h3 className="po-feature-title">Delivery · 1‑click</h3>
              <p className="po-feature-text">Déployez votre stack logicielle n’importe où — cloud, edge ou sur site — en un clic.</p>
              <div className="po-feature-tag tag-green"><span className="po-tag-dot dg" />Déploiement zéro friction</div>
            </div>
            <div className="po-feature">
              <div className="po-feature-icon ic-purple">
                <svg className="po-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 10l4.5-4.5M15 10l-4.5 4.5M15 10l4.5 4.5M15 10L10.5 5.5M12 21a9 9 0 100-18 9 9 0 000 18z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 className="po-feature-title">AI Surveillance</h3>
              <p className="po-feature-text">Monitoring intelligent — détection d’anomalies, reconnaissance et alertes en temps réel.</p>
              <div className="po-feature-tag tag-purple"><span className="po-tag-dot dp" />Sécurité ML‑powered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-order */}
      <section id="preorder" className="po-preorder">
        <div className="po-container">
          <div className="po-preorder-card">
            <div className="po-orb po-orb-blue-lg" />
            <div className="po-orb po-orb-purple-lg" />
            <div className="po-preorder-grid">
              <div className="po-preorder-left">
                <div className="po-pill po-pill-amber">
                  <span className="po-pulse-dot amber" />
                  fenêtre de pré‑commande
                </div>
                <h2 className="po-preorder-title">Sécurisez votre accès <span className="po-grad-text">aujourd’hui</span></h2>
                <p className="po-preorder-text">
                  Pré‑commander maintenant verrouille le prix promo. Après la fenêtre, le prix revient à {formatMoney(strike)}.
                </p>
                <div className="po-preorder-prices">
                  <div>
                    <span className="po-price-label">prix promo</span>
                    <span className="po-price-big">{formatMoney(price)}</span>
                  </div>
                  <div className="po-price-divider" />
                  <div>
                    <span className="po-price-label">normal</span>
                    <span className="po-strike">{formatMoney(strike)}</span>
                  </div>
                </div>
              </div>

              <div className="po-preorder-right">
                <div className="po-preorder-countdown">
                  <div className="po-preorder-countdown-label">
                    {upcoming ? 'La pré‑commande commence dans' : live ? 'L’offre se termine après' : 'Offre terminée'}
                  </div>
                  {ended ? (
                    <div className="po-ended">Cette offre n’est plus disponible.</div>
                  ) : (
                    <PreorderCountdown target={upcoming ? timing.start : timing.end} now={now} />
                  )}
                </div>
                <div className="po-preorder-actions">
                  <button
                    className={`po-btn po-btn-primary po-cta ${live ? '' : 'po-btn-locked'}`}
                    disabled={!live}
                    onClick={order}
                  >
                    {live ? (
                      <>
                        <Zap /> Pré‑commander · {formatMoney(price)}
                      </>
                    ) : (
                      <>
                        <Padlock /> {upcoming ? 'S’ouvre dans quelques instants' : 'Offre terminée'}
                      </>
                    )}
                  </button>
                  <span className="po-or">ou</span>
                  <span className="po-interested-text"><PreorderInterest /> personnes déjà intéressées</span>
                </div>
                <p className="po-note">* Le prix se verrouille à {formatMoney(price)} pendant la fenêtre de pré‑commande. Ensuite, {formatMoney(strike)}.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="po-footer">
        <div className="po-container po-footer-inner">
          <div className="po-footer-brand">
            <span>Mister-D</span>
            <span className="po-dot">·</span>
            <span className="po-footer-dim">Software Engineering</span>
          </div>
          <div className="po-footer-meta">
            <span>One ecosystem</span>
            <span className="po-vline" />
            <span>v2.0</span>
            <span className="po-vline" />
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
