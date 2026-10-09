const paths = {
  heart: 'M12 21s-7.5-4.6-9.5-9.3C1.2 8.4 3 5 6.4 5c2 0 3.4 1.1 4.1 2.4C11.2 6.1 12.6 5 14.6 5 18 5 19.8 8.4 18.5 11.7 16.5 16.4 12 21 12 21z',
  search: 'M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M5 13l4 4L19 7',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3',
  edit: 'M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  users: 'M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21a8 8 0 0116 0',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M19 12l-7 7-7-7',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  flame: 'M12 3s4 4 4 8a4 4 0 11-8 0c0-1.5.5-2.5 1-3.5C9.5 9 11 8 12 3z',
};

export function Icon({ name, className = 'w-5 h-5', filled = false }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
