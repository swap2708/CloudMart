import { Link } from 'react-router-dom';

const DEFAULT_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2280%22%20height%3D%2280%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2080%2080%22%3E%3Crect%20width%3D%2280%22%20height%3D%2280%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ctext%20x%3D%2220%22%20y%3D%2245%22%20fill%3D%22%2394a3b8%22%20font-family%3AInter%20font-size%3D%2212%22%3ECart%3C%2Ftext%3E%3C%2Fsvg%3E";

export const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const lineTotal = (Number(item.price) * item.quantity).toFixed(2);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1.25rem 0',
        borderBottom: '1px solid var(--border-color)',
        gap: '1.25rem',
      }}
    >
      {/* Product Image */}
      <Link to={`/products/${item.productId}`}>
        <img
          src={item.imageUrl || DEFAULT_IMAGE}
          alt={item.name}
          style={{
            width: '72px',
            height: '72px',
            objectFit: 'cover',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-subtle)',
          }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_IMAGE;
          }}
        />
      </Link>

      {/* Title & Unit Price */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          to={`/products/${item.productId}`}
          style={{
            fontWeight: 600,
            fontSize: '1rem',
            color: 'var(--text-main)',
            display: 'block',
            marginBottom: '0.25rem',
            textDecoration: 'none',
          }}
        >
          {item.name}
        </Link>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          ${Number(item.price).toFixed(2)} each
        </span>
      </div>

      {/* Quantity Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          disabled={item.quantity <= 1}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span
          style={{
            minWidth: '32px',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '0.95rem',
          }}
        >
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      {/* Line Total */}
      <div
        style={{
          width: '90px',
          textAlign: 'right',
          fontWeight: 700,
          fontSize: '1.05rem',
          color: 'var(--text-main)',
        }}
      >
        ${lineTotal}
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(item.productId)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-light)',
          padding: '0.5rem',
          borderRadius: 'var(--radius-sm)',
          transition: 'var(--transition)',
        }}
        aria-label="Remove item"
        title="Remove item"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
};

export default CartItem;
