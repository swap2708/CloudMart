import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import './admin.css';

const navItems = [
  { to: '/admin', label: '📊 Dashboard', end: true },
  { to: '/admin/products', label: '📦 Products' },
  { to: '/admin/orders', label: '🛒 Orders' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-logo">☁️ CloudMart</span>
          <span className="admin-badge">Admin</span>
        </div>
        <nav className="admin-nav">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <p className="admin-user-email">{user?.email}</p>
          <button onClick={handleLogout} className="btn btn-sm btn-danger" style={{ width: '100%' }}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
