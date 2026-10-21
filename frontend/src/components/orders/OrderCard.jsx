import { Link } from 'react-router-dom';
import OrderStatusBadge from './OrderStatusBadge';

export const OrderCard = ({ order }) => {
  const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div className="card-header">
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Order ID:</span>
          <span style={{ fontWeight: 700, marginLeft: '0.35rem' }}>#{order.id}</span>
          <span style={{ margin: '0 0.5rem', color: 'var(--border-color)' }}>|</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formattedDate}</span>
        </div>
        <div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {order.items?.map((i) => `${i.product_name || `Product #${i.product_id}`} (x${i.quantity})`).join(', ')}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Total Amount</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ${Number(order.total_amount).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link to={`/orders/${order.id}`} className="btn btn-outline btn-sm">
          View Order Details &rarr;
        </Link>
      </div>
    </div>
  );
};

export default OrderCard;
