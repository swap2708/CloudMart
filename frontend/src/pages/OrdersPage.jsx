import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import OrderCard from '../components/orders/OrderCard';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ordersApi.getMyOrders();
        if (isMounted) setOrders(data);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Failed to load order history. Please try again.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <Spinner center text="Loading your orders..." />;
  }

  return (
    <div className="container" style={{ maxWidth: '850px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          My Orders
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Track past and active purchases placed with your CloudMart account.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No Orders Yet</h3>
          <p>You haven&apos;t placed any orders with CloudMart yet.</p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
