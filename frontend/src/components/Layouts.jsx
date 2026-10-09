import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 w-full"><Outlet /></main>
      <Footer />
    </div>
  );
}

export function Container({ children, className = '' }) {
  return <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 ${className}`}>{children}</div>;
}
