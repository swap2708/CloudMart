import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🛒</div>
      <h1 style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--gray-800)', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--gray-600)', margin: '1rem 0 2rem' }}>
        Oops! This page doesn&apos;t exist.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/" className="btn btn-primary">Go Home</Link>
        <Link to="/products" className="btn btn-secondary">Browse Products</Link>
      </div>
    </div>
  );
}
