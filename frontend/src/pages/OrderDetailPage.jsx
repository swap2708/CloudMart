import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';

export const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ordersApi.getOrderById(id);
        if (isMounted) setOrder(data);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Unable to retrieve order details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return <Spinner center text="Fetching order details..." />;
  }

  if (error || !order) {
    return (
      <div className="container">
        <Alert variant="danger">{error || 'Order not found.'}</Alert>
        <Link to="/orders" className="btn btn-secondary">
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  const orderDate = new Date(order.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="container" style={{ maxWidth: '850px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/orders" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
          &larr; Back to Order History
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 700, margin: 0 }}>
              Order #{order.id}
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Placed on {orderDate}
            </span>
          </div>
          <div>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* Order Items Table */}
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem' }}>Purchased Items</h2>
        <div className="table-responsive" style={{ marginBottom: '1.5rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: 'center' }}>Quantity</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/products/${item.product_id}`} style={{ fontWeight: 600 }}>
                      {item.product_name || `Product #${item.product_id}`}
                    </Link>
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>${Number(item.unit_price).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', maxWidth: '320px', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Items Subtotal:</span>
            <span>${Number(order.total_amount).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Shipping Fee:</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '1.2rem', fontWeight: 800 }}>
            <span>Order Total:</span>
            <span style={{ color: 'var(--primary)' }}>${Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
