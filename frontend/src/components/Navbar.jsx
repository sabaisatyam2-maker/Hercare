import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';
import { Button } from './Button';

const publicLinks = [
  { to: '/recipes', label: 'Recipes' },
  { to: '/workouts', label: 'Workouts' },
  { to: '/programs', label: 'Programs' },
];
const userLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/daily-log', label: 'Daily Log' },
  { to: '/my-programs', label: 'My Programs' },
  { to: '/favorites', label: 'Favorites' },
];

const linkCls = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
    isActive ? 'text-rose-600 bg-rose-50' : 'text-ink-600 hover:text-rose-600 hover:bg-rose-50'}`;

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const links = [
    ...publicLinks,
    ...(user && !isAdmin ? userLinks : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const onLogout = async () => { await logout(); navigate('/'); };

  return (
    <header className="sticky top-0 z-50 bg-white/75 backdrop-blur-lg border-b border-white">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4" aria-label="Main">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-rose-500 tracking-tight">
          <span aria-hidden="true">🌸</span> HerCare
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => <NavLink key={l.to} to={l.to} className={linkCls}>{l.label}</NavLink>)}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-ink-600">Hi, <b className="text-ink-900">{user.name?.split(' ')[0]}</b></span>
              <Button variant="outline" size="sm" onClick={onLogout}>Log out</Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">Log in</Button>
              <Button to="/register" size="sm">Get started</Button>
            </>
          )}
        </div>

        <button className="lg:hidden p-2 rounded-lg hover:bg-rose-50" onClick={() => setOpen(!open)}
          aria-label="Toggle menu" aria-expanded={open}>
          <Icon name={open ? 'x' : 'menu'} className="w-6 h-6" />
        </button>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-ink-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
          {links.map((l) => <NavLink key={l.to} to={l.to} className={linkCls}>{l.label}</NavLink>)}
          <div className="pt-3 mt-2 border-t border-ink-100 flex gap-3">
            {user ? (
              <Button variant="outline" full onClick={onLogout}>Log out</Button>
            ) : (
              <>
                <Button to="/login" variant="outline" full>Log in</Button>
                <Button to="/register" full>Get started</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
