import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';

const links = [
  { to: '/admin', label: 'Overview', end: true, emoji: '📊' },
  { to: '/admin/categories', label: 'Categories', emoji: '🏷️' },
  { to: '/admin/recipes', label: 'Recipes', emoji: '🥗' },
  { to: '/admin/workouts', label: 'Workouts', emoji: '🧘‍♀️' },
  { to: '/admin/programs', label: 'Programs', emoji: '📅' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const cls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
      isActive ? 'bg-rose-500 text-white shadow-sm shadow-rose-200' : 'text-ink-600 hover:bg-rose-50 hover:text-rose-600'}`;

  const onLogout = async () => { await logout(); navigate('/'); };

  const nav = (
    <>
      <nav className="flex flex-col gap-1" onClick={() => setOpen(false)}>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={cls}><span aria-hidden="true">{l.emoji}</span>{l.label}</NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t border-ink-100 space-y-2">
        <Link to="/" className="block text-sm text-ink-600 hover:text-rose-500 px-4">↗ View website</Link>
        <p className="text-xs text-ink-400 px-4 truncate">{user?.email}</p>
        <Button variant="outline" size="sm" full onClick={onLogout}>Log out</Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white/80 backdrop-blur border-r border-white p-5 sticky top-0 h-screen">
        <Link to="/admin" className="font-extrabold text-xl text-rose-500 mb-8 px-2">🌸 HerCare <span className="text-xs text-ink-400 font-semibold">admin</span></Link>
        {nav}
      </aside>

      <div className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-ink-100 px-4 h-14 flex items-center justify-between">
        <Link to="/admin" className="font-extrabold text-rose-500">🌸 HerCare admin</Link>
        <button onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open} className="p-2"><Icon name={open ? 'x' : 'menu'} className="w-6 h-6" /></button>
      </div>
      {open && <div className="lg:hidden bg-white p-4 flex flex-col min-h-[70vh] border-b border-ink-100">{nav}</div>}

      <main className="flex-1 min-w-0 p-4 sm:p-8"><Outlet /></main>
    </div>
  );
}
