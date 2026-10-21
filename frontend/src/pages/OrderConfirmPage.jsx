import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';

export const OrderConfirmPage = () => {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [shippingAddress] = useState(location.state?.shippingAddress || 'Standard Delivery Address');
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!order && id) {
      const fetchOrder = async () => {
        setLoading(true);
        try {
          const data = await ordersApi.getOrderById(id);
          if (isMounted) setOrder(data);
        } catch (err) {
          if (isMounted) {
            setError(err.response?.data?.detail || 'Failed to retrieve order details.');
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchOrder();
    }
    return () => { isMounted = false; };
  }, [id, order]);

  if (loading) {
    return <Spinner center text="Confirming your order..." />;
  }

  if (error || !order) {
    return (
      <div className="container">
        <Alert variant="danger">{error || 'Order confirmation not found.'}</Alert>
        <Link to="/orders" className="btn btn-primary">
          View All Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '780px' }}>
      {/* Success Hero Header */}
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--success-bg)',
            border: '2px solid var(--success-border)',
            color: 'var(--success)',
            fontSize: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
          }}
        >
          ✓
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          Order Confirmed!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
          Thank you for shopping with CloudMart. Your order has been placed and received by our fulfillment system.
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: 'var(--bg-subtle)',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <span>
            Order Reference: <strong>#{order.id}</strong>
          </span>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Order Details Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          Order Summary
        </h2>

        {/* Destination & Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Shipping Address</span>
            <p style={{ fontWeight: 600 }}>{shippingAddress}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Order Placed</span>
            <p style={{ fontWeight: 600 }}>
              {new Date(order.created_at).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>

        {/* Purchased Items List */}
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Items Purchased</h3>
        <div style={{ borderTop: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          {order.items?.map((item) => (
            <div
              key={item.id || item.product_id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.85rem 0',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.925rem',
              }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>{item.product_name || `Product #${item.product_id}`}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  &times; {item.quantity}
                </span>
              </div>
              <span style={{ fontWeight: 600 }}>
                ${(Number(item.unit_price) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
          <span>${Number(order.total_amount).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.95rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Shipping:</span>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '2px solid var(--border-color)',
            paddingTop: '0.75rem',
            fontSize: '1.25rem',
            fontWeight: 800,
          }}
        >
          <span>Total Paid:</span>
          <span style={{ color: 'var(--primary)' }}>${Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {/* Action Navigation */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/orders" className="btn btn-primary">
          View All Orders
        </Link>
        <Link to="/products" className="btn btn-secondary">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmPage;
