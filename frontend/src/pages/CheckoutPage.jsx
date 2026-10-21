import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { ordersApi } from '../api/orders';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

export const CheckoutPage = () => {
  const { user } = useAuth();
  const { items, itemCount, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  // Shipping Form State
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    address: '100 Cloud Native Way',
    city: 'Seattle',
    postalCode: '98101',
    country: 'United States',
  });

  // Mock Payment State
  const [paymentData] = useState({
    cardName: user?.full_name || 'CloudMart Demo User',
    cardNumber: '•••• •••• •••• 4242',
    expDate: '12/28',
    cvv: '•••',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  if (items.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Please add items to your cart before proceeding to checkout.</p>
          <Link to="/products" className="btn btn-primary">
            Explore Products
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.address.trim()) errors.address = 'Street address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.postalCode.trim()) errors.postalCode = 'Postal code is required';
    return errors;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const orderPayload = {
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
      };

      // Call actual backend order creation endpoint
      const createdOrder = await ordersApi.createOrder(orderPayload);

      // Clear persisted shopping cart
      clearCart();

      // Navigate to order confirmation page with order state
      navigate(`/order-confirm/${createdOrder.id}`, {
        state: {
          order: createdOrder,
          shippingAddress: `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
        },
      });
    } catch (err) {
      console.error('Order creation error:', err);
      const detailMsg =
        err.response?.data?.detail ||
        'Unable to process your order. Please verify item availability and try again.';
      setSubmitError(detailMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
        Checkout
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Confirm shipping destination and complete mock payment verification.
      </p>

      {submitError && (
        <Alert variant="danger" onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={handlePlaceOrder}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2.5rem', alignItems: 'start' }}>
          {/* Left Column: Shipping & Payment */}
          <div>
            {/* Shipping Address */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📍</span> 1. Shipping Details
              </h2>

              <Input
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                error={formErrors.fullName}
                required
              />

              <Input
                label="Street Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                error={formErrors.address}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  error={formErrors.city}
                  required
                />
                <Input
                  label="Postal Code"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  error={formErrors.postalCode}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Country</label>
                <select
                  name="country"
                  className="form-control"
                  value={formData.country}
                  onChange={handleInputChange}
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="Japan">Japan</option>
                </select>
              </div>
            </div>

            {/* Mock Payment Section */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💳</span> 2. Mock Payment
                </h2>
                <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                  DEMO SANDBOX
                </span>
              </div>

              <Alert variant="info">
                This store operates in demonstration mode. No real credit card or bank account will be charged.
              </Alert>

              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>MOCK PAYMENT CARD</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>VISA</span>
                </div>
                <div style={{ fontSize: '1.15rem', letterSpacing: '0.15em', fontWeight: 600, marginBottom: '1rem' }}>
                  {paymentData.cardNumber}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>CARDHOLDER</span>
                    <span style={{ fontWeight: 600 }}>{paymentData.cardName}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>EXPIRES</span>
                    <span style={{ fontWeight: 600 }}>{paymentData.expDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review */}
          <div className="card" style={{ padding: '1.75rem', position: 'sticky', top: '5.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              Order Review
            </h2>

            <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              {items.map((item) => (
                <div
                  key={item.productId}
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}
                >
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Qty: {item.quantity} &times; ${Number(item.price).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Items Subtotal:</span>
              <span style={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Shipping & Handling:</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '2px solid var(--border-color)',
                paddingTop: '1rem',
                marginBottom: '1.5rem',
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total Billed:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              block
              isLoading={isSubmitting}
            >
              Place Order (${subtotal.toFixed(2)})
            </Button>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
              By placing your order, you agree to CloudMart&apos;s Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
