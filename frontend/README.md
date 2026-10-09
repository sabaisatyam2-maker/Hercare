# HerCare Frontend (React + Vite + Tailwind + GSAP)

Backend: http://localhost:5000  |  Frontend: http://localhost:5173

## Apne project mein lagane ke steps (vite-project folder)
1. Apne `vite-project` ka `src` folder backup karo (rename karke `src_old`).
2. Is zip ka `src/`, `index.html`, `vite.config.js` apne `vite-project` mein copy karo (purane ko replace karo).
3. Packages wahi hain jo aap install kar chuke ho (axios, react-router-dom, gsap, tailwindcss, @tailwindcss/vite). Naya kuch install nahi karna.
4. `npm run dev` -> http://localhost:5173 (port 5173 zaroori hai, backend CORS yahi allow karta hai).
5. Backend alag window mein `npm run dev` (port 5000) chalta rehna chahiye.

## Folder guide
- src/api       axios.js (token memory mein + auto refresh), services.js (saare API calls)
- src/context   Auth, Toast, Favorites
- src/routes    ProtectedRoute / AdminRoute / GuestRoute
- src/pages     user pages, src/pages/admin = admin panel
- src/components shared UI (Button, Cards, Navbar, forms...)

## API URL badalna ho to
`.env.example` ko `.env` naam se copy karo aur `VITE_API_URL` set karo.
