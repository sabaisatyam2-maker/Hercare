import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';

export function FavoriteButton({ type, id, className = '' }) {
  const { isFav, toggle } = useFavorites();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const active = isFav(type, id);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggle(type, id);
    if (res?.needsLogin) {
      toast.info('Log in to save your favorites.');
      navigate('/login', { state: { from: location } });
    }
  };

  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      className={`w-9 h-9 rounded-full grid place-items-center bg-white/90 shadow-sm transition-all hover:scale-110 active:scale-95
        ${active ? 'text-rose-500' : 'text-ink-400 hover:text-rose-400'} ${className}`}>
      <Icon name="heart" filled={active} className="w-5 h-5" />
    </button>
  );
}
