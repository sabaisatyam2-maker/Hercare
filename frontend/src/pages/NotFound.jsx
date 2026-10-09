import { Container } from '../components/Layouts';
import { Button } from '../components/Button';

export default function NotFound() {
  return (
    <Container>
      <div className="card p-12 text-center max-w-lg mx-auto">
        <p className="text-6xl mb-4">🌧️</p>
        <h1 className="text-3xl font-extrabold">Page not found</h1>
        <p className="text-ink-600 mt-2 mb-6">The page you're looking for doesn't exist or has moved.</p>
        <Button to="/">Back to home</Button>
      </div>
    </Container>
  );
}
