import Button from '../ui/Button';

export const CartSummary = ({
  subtotal = 0,
  itemCount = 0,
  onCheckout,
  isCheckingOut = false,
  canCheckout = true,
  buttonText = 'Proceed to Checkout',
}) => {
  const shipping = 0.0;
  const total = subtotal + shipping;

  return (
    <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '5.5rem' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
        Order Summary
      </h3>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Items ({itemCount}):</span>
        <span style={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Shipping:</span>
        <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          marginTop: '1rem',
          paddingTop: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total:</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
          ${total.toFixed(2)}
        </span>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        * Final item prices and live inventory availability are verified securely by the server at checkout.
      </p>

      <Button
        variant="primary"
        size="lg"
        block
        disabled={!canCheckout || itemCount === 0 || isCheckingOut}
        isLoading={isCheckingOut}
        onClick={onCheckout}
      >
        {buttonText}
      </Button>
    </div>
  );
};

export default CartSummary;
