import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, ShoppingCart, User, Package, LogOut, Boxes } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { CustomerThemeProvider, useCustomerTheme } from '../context/CustomerThemeContext';
import CartSheet from './CartSheet';

const SHELL_CSS = `
.pulsar-shell {
  --pls-bg: var(--pt-bg);
  --pls-surface: var(--pt-surface);
  --pls-surface2: var(--pt-surface2);
  --pls-surface3: var(--pt-surface3);
  --pls-text: var(--pt-text);
  --pls-muted: var(--pt-muted);
  --pls-muted2: var(--pt-muted2);
  --pls-cyan: var(--pt-accent);
  --pls-violet: var(--pt-accent2);
  --pls-grad: var(--pt-grad);
  --pls-border: var(--pt-border);
  --pls-border2: var(--pt-border-strong);
  --pls-mono: var(--pt-mono);
  background: var(--pt-bg);
  color: var(--pt-text);
  font-family: var(--pt-font);
  min-height: 100vh;
}
.pulsar-shell .surface-card { background: var(--pt-surface); border: 1px solid var(--pt-border); }
.pulsar-shell .input-field { background: var(--pt-surface2); color: var(--pt-text); border: 1px solid var(--pt-border-strong); }
.pulsar-shell .input-field:focus { border-color: var(--pt-accent); box-shadow: 0 0 0 3px var(--pt-border-faint); }
.pulsar-shell .input-field::placeholder { color: var(--pt-muted2); }
.pulsar-shell select.input-field option { background: var(--pt-surface2); color: var(--pt-text); }
.pulsar-shell .gold-btn { background: var(--pt-grad); color: var(--pt-grad-text); }
.psh { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--pt-bg) 80%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--pt-border); }
.psh-row { max-width: 1280px; margin: 0 auto; padding: 14px 32px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.psh-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--pt-text); }
.psh-mark { width: 30px; height: 30px; border-radius: 10px; background: var(--pt-grad); display: grid; place-items: center; color: var(--pt-grad-text); font-size: 15px; font-weight: 800; box-shadow: 0 0 18px var(--pt-border-faint); flex-shrink: 0; }
.psh-name { font-family: var(--pt-font); font-size: 15px; font-weight: 800; letter-spacing: 0.06em; }
.psh-sub { display: block; font-family: var(--pt-mono); font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--pt-muted2); }
.psh-nav { display: flex; align-items: center; gap: 6px; }
.psh-link { padding: 8px 14px; border-radius: 999px; font-size: 13px; color: var(--pt-muted); text-decoration: none; transition: color 0.15s, background 0.15s; white-space: nowrap; }
.psh-link:hover { color: var(--pt-text); background: rgba(255, 255, 255, 0.04); }
.psh-link.active { color: var(--pt-accent); background: var(--pt-border-faint); }
.psh-icons { display: flex; align-items: center; gap: 10px; }
.psh-icon { position: relative; width: 42px; height: 42px; border-radius: 50%; border: 1px solid var(--pt-border-strong); background: color-mix(in srgb, var(--pt-surface) 70%, transparent); color: var(--pt-text); display: grid; place-items: center; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s, background 0.2s; flex-shrink: 0; }
.psh-icon:hover { border-color: var(--pt-accent); box-shadow: 0 0 16px var(--pt-border-faint); transform: translateY(-1px); }
.psh-icon.open { border-color: var(--pt-accent); background: var(--pt-border-faint); }
.psh-badge { position: absolute; top: -3px; right: -3px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 10px; display: grid; place-items: center; font-family: var(--pt-mono); font-size: 10px; font-weight: 700; color: var(--pt-grad-text); background: var(--pt-grad); box-shadow: 0 0 12px var(--pt-border-faint); }
.psh-user { position: relative; }
.psh-menu { position: absolute; top: calc(100% + 12px); right: 0; min-width: 232px; padding: 8px; border-radius: 16px; border: 1px solid var(--pt-border-strong); background: color-mix(in srgb, var(--pt-surface) 92%, transparent); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45); z-index: 300; animation: pshIn 0.18s ease; }
.psh-menu::before { content: ''; position: absolute; top: -6px; right: 16px; width: 12px; height: 12px; transform: rotate(45deg); background: inherit; border-left: 1px solid var(--pt-border-strong); border-top: 1px solid var(--pt-border-strong); }
@keyframes pshIn { from { opacity: 0; transform: translateY(-6px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
.psh-menu a, .psh-menu button.psh-logout { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 12px; border: none; border-radius: 10px; background: transparent; color: var(--pt-text); font-size: 13.5px; cursor: pointer; text-align: left; text-decoration: none; transition: background 0.15s, color 0.15s; }
.psh-menu a svg, .psh-menu button.psh-logout svg { width: 18px; height: 18px; color: var(--pt-muted); flex-shrink: 0; }
.psh-menu a:hover { background: var(--pt-border-faint); }
.psh-menu button.psh-logout:hover { background: var(--pt-danger-soft); color: var(--pt-danger); }
.psh-userhead { padding: 8px 12px 12px; border-bottom: 1px solid var(--pt-border); margin-bottom: 6px; }
.psh-userhead-name { font-size: 13px; font-weight: 700; }
.psh-userhead-mail { font-size: 11px; color: var(--pt-muted2); margin-top: 2px; }
.psf { border-top: 1px solid var(--pt-border); margin-top: 48px; }
.psf-row { max-width: 1280px; margin: 0 auto; padding: 40px 32px 28px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 28px; }
.psf h4 { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--pt-muted2); margin-bottom: 14px; font-family: var(--pt-mono); }
.psf ul { list-style: none; display: flex; flex-direction: column; gap: 10px; padding: 0; margin: 0; }
.psf a { color: var(--pt-muted); text-decoration: none; font-size: 13px; transition: color 0.15s; }
.psf a:hover { color: var(--pt-accent); }
.psf-brand p { color: var(--pt-muted); font-size: 13px; margin: 14px 0 0; max-width: 280px; }
.psf-contact { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
.psf-contact a, .psf-contact span { color: var(--pt-muted); font-size: 13px; text-decoration: none; }
.psf-contact a:hover { color: var(--pt-accent); }
.psf-bottom { border-top: 1px solid var(--pt-border); padding: 18px 32px; text-align: center; font-size: 12px; color: var(--pt-muted2); }
.psf-subscribe { display: flex; gap: 8px; margin-top: 14px; }
.psf-subscribe input { flex: 1; background: var(--pt-surface2); color: var(--pt-text); border: 1px solid var(--pt-border-strong); border-radius: 999px; padding: 9px 14px; font-size: 13px; font-family: var(--pt-font); outline: none; }
.psf-subscribe input::placeholder { color: var(--pt-muted2); }
.psf-subscribe button { background: var(--pt-grad); color: var(--pt-grad-text); border: none; border-radius: 999px; padding: 9px 16px; font-size: 12px; font-weight: 700; font-family: var(--pt-font); cursor: pointer; white-space: nowrap; }
@media (max-width: 720px) {
  .psh-row { padding: 12px 16px; }
  .psh-nav { display: none; }
  .psf-row { grid-template-columns: 1fr 1fr; padding: 28px 16px; }
  .psf-bottom { padding: 14px 16px; }
}
`;

function ShellInner({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const { customer, logout } = useCustomerAuth();
  const { light, toggleLight, cssVars, brand, contact } = useCustomerTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const globeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (globeRef.current && !globeRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    try { logout(); } catch {}
    navigate('/');
  };

  return (
    <div className="pulsar-shell" style={cssVars}>
      <style>{SHELL_CSS}</style>

      <header className="psh">
        <div className="psh-row">
          <a href="/" className="psh-brand">
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} style={{ height: 40, flexShrink: 0 }} />
            ) : (
              <span className="psh-mark"><Boxes size={15} /></span>
            )}
            <span>
              <span className="psh-name">{brand.name}</span>
              <span className="psh-sub">{brand.sub}</span>
            </span>
          </a>

          <nav className="psh-nav">
            <a href="/" className="psh-link">Boutique</a>
            <Link to="/track" className={`psh-link${isActive('/track') ? ' active' : ''}`}>Suivi de commande</Link>
            {customer ? (
              <Link to="/profile" className={`psh-link${isActive('/profile') ? ' active' : ''}`}>Mes commandes</Link>
            ) : (
              <Link to="/auth/login" className={`psh-link${isActive('/auth') ? ' active' : ''}`}>Mon compte</Link>
            )}
          </nav>

          <div className="psh-icons">
            <button className="psh-icon" onClick={toggleLight} aria-label="Changer de thème" title="Changer de thème">
              {light ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button className="psh-icon" onClick={() => setCartOpen(true)} aria-label="Panier">
              <ShoppingCart size={17} />
              {count > 0 && <span className="psh-badge">{count}</span>}
            </button>
            <div className="psh-user" ref={globeRef}>
              <button className={`psh-icon${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(o => !o)} aria-label="Mon compte">
                <User size={17} />
              </button>
              {menuOpen && (
                <div className="psh-menu">
                  {customer && (
                    <div className="psh-userhead">
                      <p className="psh-userhead-name">{customer.name}</p>
                      {customer.email && <p className="psh-userhead-mail">{customer.email}</p>}
                    </div>
                  )}
                  <Link to="/profile" onClick={() => setMenuOpen(false)}>
                    <User size={16} /> Mon compte
                  </Link>
                  <Link to="/track" onClick={() => setMenuOpen(false)}>
                    <Package size={16} /> Suivi de commande
                  </Link>
                  {customer && (
                    <button className="psh-logout" onClick={handleLogout}>
                      <LogOut size={16} /> Déconnexion
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="psf">
        <div className="psf-row">
          <div className="psf-brand">
            <a href="/" className="psh-brand">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} style={{ height: 40, flexShrink: 0 }} />
              ) : (
                <span className="psh-mark"><Boxes size={15} /></span>
              )}
              <span>
                <span className="psh-name">{brand.name}</span>
                <span className="psh-sub">Designed by Driss-Djellali</span>
              </span>
            </a>
            <p>
              {brand.logo
                ? 'Des produits frais et locaux, livrés directement chez vous.'
                : 'Écouteurs, chargeurs, téléphones et ordinateurs pensés comme un seul écosystème à charge rapide.'}
            </p>
            <div className="psf-contact">
              {contact.phone ? (
                <a href={`tel:${contact.phone.replace(/\s+/g, '')}`}>{contact.phone}</a>
              ) : (
                <span>Téléphone</span>
              )}
              {contact.email ? (
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              ) : (
                <span>Email</span>
              )}
              {contact.facebook ? (
                <a href={contact.facebook} target="_blank" rel="noreferrer">Facebook</a>
              ) : (
                <span>Facebook</span>
              )}
              {contact.instagram ? (
                <a href={contact.instagram} target="_blank" rel="noreferrer">Instagram</a>
              ) : (
                <span>Instagram</span>
              )}
            </div>
          </div>
          <div>
            <h4>{brand.logo ? 'Organic' : 'Boutique'}</h4>
            <ul>
              {brand.logo ? (
                <>
                  <li><a href="/#shop">À propos</a></li>
                  <li><a href="/mentions-legales">Conditions</a></li>
                  <li><a href="/#featured">Nos Journaux</a></li>
                </>
              ) : (
                <>
                  <li><a href="/">Boutique</a></li>
                  <li><a href="/">La gamme</a></li>
                  <li><a href="/">En vedette</a></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4>{brand.logo ? 'Liens rapides' : 'Support'}</h4>
            <ul>
              <li><Link to="/track">Suivi de commande</Link></li>
              <li><Link to="/profile">Mon compte</Link></li>
              {brand.logo ? (
                <>
                  <li><a href="/#featured">Offres</a></li>
                  <li><a href="/#lineup">Boutique</a></li>
                </>
              ) : (
                <>
                  <li><a href="/">Garantie 12 mois</a></li>
                  <li><a href="/">Contact</a></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4>{brand.logo ? 'Abonnez-vous' : 'Entreprise'}</h4>
            {brand.logo ? (
              <>
                <p style={{ color: 'var(--pt-muted)', fontSize: 13, margin: 0 }}>Abonnez-vous à notre newsletter pour recevoir nos actualités.</p>
                <form className="psf-subscribe" onSubmit={(e) => { e.preventDefault(); const btn = (e.target as HTMLFormElement).querySelector('button'); if (btn) btn.textContent = '✓'; }}>
                  <input type="email" placeholder="Adresse email" aria-label="Email" />
                  <button type="submit">S'abonner</button>
                </form>
              </>
            ) : (
              <ul>
                <li><a href="/">À propos</a></li>
                <li><a href="/">Atelier &amp; tests</a></li>
                <li><a href="/mentions-legales">Mentions légales</a></li>
              </ul>
            )}
          </div>
        </div>
        <div className="psf-bottom">
          <span>© {new Date().getFullYear()} Driss Djellali. All Rights Reserved.</span>
        </div>
      </footer>

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

export default function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <CustomerThemeProvider>
      <ShellInner>{children}</ShellInner>
    </CustomerThemeProvider>
  );
}
