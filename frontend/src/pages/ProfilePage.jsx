import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="container" style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h1>My Profile</h1>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 600, color: 'var(--gray-600)', fontSize: '0.875rem', display: 'block', marginBottom: 4 }}>
            Full Name
          </label>
          <p style={{ fontSize: '1.125rem', margin: 0 }}>{user?.full_name || '—'}</p>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 600, color: 'var(--gray-600)', fontSize: '0.875rem', display: 'block', marginBottom: 4 }}>
            Email Address
          </label>
          <p style={{ fontSize: '1.125rem', margin: 0 }}>{user?.email || '—'}</p>
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ fontWeight: 600, color: 'var(--gray-600)', fontSize: '0.875rem', display: 'block', marginBottom: 4 }}>
            Account Role
          </label>
          <span className={`badge badge-${user?.role === 'admin' ? 'blue' : 'green'}`} style={{ textTransform: 'capitalize' }}>
            {user?.role || 'customer'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/orders" className="btn btn-secondary">View My Orders</Link>
          <button onClick={logout} className="btn btn-danger">Sign Out</button>
        </div>
      </div>
    </div>
  );
}
