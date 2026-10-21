import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { ordersApi } from '../api/orders';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';

export const CartPage = () => {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const [validationAlert, setValidationAlert] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [serverCart, setServerCart] = useState(null);

  // Validate cart against server database on load or when items change
  useEffect(() => {
    let isMounted = true;
    if (items.length === 0) {
      setServerCart(null);
      setValidationAlert(null);
      return;
    }

    const validateItems = async () => {
      setIsValidating(true);
      try {
        const payload = items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        }));
        const calcResult = await ordersApi.calculateCart(payload);
        if (isMounted) {
          setServerCart(calcResult);
          if (!calcResult.can_checkout) {
            setValidationAlert({
              type: 'warning',
              message: 'One or more items in your cart exceed current available inventory.',
            });
          } else {
            setValidationAlert(null);
          }
        }
      } catch (err) {
        console.warn('Live cart calculation failed, using local values:', err);
      } finally {
        if (isMounted) setIsValidating(false);
      }
    };

    validateItems();
    return () => { isMounted = false; };
  }, [items]);

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <h2>Your Shopping Cart is Empty</h2>
          <p>Explore our catalog of high-performance cloud hardware and accessories.</p>
          <Link to="/products" className="btn btn-primary">
            Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  // Use server authoritative total if available, else local subtotal
  const displayTotal = serverCart ? Number(serverCart.total_amount) : subtotal;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </h1>
        <Button variant="secondary" size="sm" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      {validationAlert && (
        <Alert variant={validationAlert.type}>
          {validationAlert.message}
        </Alert>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        {/* Cart Items List */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <span>PRODUCT</span>
            <span style={{ marginRight: '6.5rem' }}>QUANTITY</span>
            <span>SUBTOTAL</span>
          </div>

          <div>
            {items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/products" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              &larr; Continue Shopping
            </Link>
            {isValidating && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Verifying live inventory...
              </span>
            )}
          </div>
        </div>

        {/* Order Summary Checkout Card */}
        <CartSummary
          subtotal={displayTotal}
          itemCount={itemCount}
          onCheckout={handleProceedToCheckout}
          canCheckout={serverCart ? serverCart.can_checkout : true}
          buttonText="Proceed to Checkout"
        />
      </div>
    </div>
  );
};

export default CartPage;
