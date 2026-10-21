import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          adminApi.getAllOrders({ limit: 5, skip: 0 }),
          adminApi.getProducts({ limit: 1, skip: 0 }),
        ]);
        setRecentOrders(ordersRes.slice(0, 5));
        // Build quick stats
        const totalRevenue = ordersRes.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        setStats({
          orderCount: ordersRes.length,
          revenue: totalRevenue.toFixed(2),
        });
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Dashboard</h1>
      </div>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats?.orderCount ?? '—'}</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">\${stats?.revenue ?? '—'}</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Orders</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No orders yet.</td></tr>
            ) : recentOrders.map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.user_email || order.user_id}</td>
                <td>\${Number(order.total_amount).toFixed(2)}</td>
                <td><span className={`badge badge-${statusColor(order.status)}`} style={{ textTransform: 'capitalize' }}>{order.status}</span></td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusColor(status) {
  const map = { pending: 'yellow', confirmed: 'blue', processing: 'blue', shipped: 'purple', delivered: 'green', cancelled: 'red' };
  return map[status] || 'gray';
}
