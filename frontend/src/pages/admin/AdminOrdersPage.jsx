import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import './admin.css';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getAllOrders({ limit: 200, skip: 0 });
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    setError('');
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      setSuccess(`Order #${orderId} status updated to "${newStatus}".`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      setError(err.response?.data?.detail || 'Status update failed.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Orders</h1>
        <button onClick={load} className="btn btn-secondary btn-sm">Refresh</button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><Spinner size="lg" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>
                    No orders found.
                  </td>
                </tr>
              ) : orders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>#{order.id}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                    {order.user_email || `User #${order.user_id}`}
                  </td>
                  <td>{order.items?.length ?? '—'}</td>
                  <td>\${Number(order.total_amount).toFixed(2)}</td>
                  <td><OrderStatusBadge status={order.status} /></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td>
                    <select
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        border: '1px solid var(--gray-300)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        background: '#fff',
                      }}
                    >
                      {ORDER_STATUSES.map(s => (
                        <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                    {updating === order.id && <Spinner size="sm" style={{ marginLeft: 8 }} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
