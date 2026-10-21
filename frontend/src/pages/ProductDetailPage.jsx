import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsApi } from '../api/products';
import { useCart } from '../hooks/useCart';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const DEFAULT_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20500%20400%22%3E%3Crect%20width%3D%22500%22%20height%3D%22400%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ctext%20x%3D%22180%22%20y%3D%22210%22%20fill%3D%22%2394a3b8%22%20font-family%3AInter%20font-size%3D%2224%22%3ECloudMart%3C%2Ftext%3E%3C%2Fsvg%3E";

export const ProductDetailPage = () => {
  const { id } = useParams();
  const { addItem, getItemQuantity } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await productsApi.getProductById(id);
        if (isMounted) setProduct(data);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Product could not be found or has been removed.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return <Spinner center text="Loading product details..." />;
  }

  if (error || !product) {
    return (
      <div className="container">
        <Alert variant="danger">{error || 'Product not found.'}</Alert>
        <Link to="/products" className="btn btn-secondary">
          &larr; Back to Catalog
        </Link>
      </div>
    );
  }

  const stock = product.stock_quantity !== undefined ? product.stock_quantity : 0;
  const isOutOfStock = stock <= 0;
  const inCartQty = getItemQuantity(product.id);
  const maxAvailable = Math.max(0, stock - inCartQty);

  const handleAddToCart = () => {
    if (isOutOfStock || quantity <= 0) return;
    addItem(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 4000);
  };

  return (
    <div className="container">
      {/* Breadcrumb Navigation */}
      <nav style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <Link to="/products" style={{ color: 'var(--text-muted)' }}>Catalog</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} style={{ color: 'var(--text-muted)' }}>
          {product.category}
        </Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{product.name}</span>
      </nav>

      {addedSuccess && (
        <Alert variant="success" onClose={() => setAddedSuccess(false)}>
          Added <strong>{quantity} {quantity === 1 ? 'item' : 'items'}</strong> of &quot;{product.name}&quot; to your shopping cart!
          <span style={{ marginLeft: '1rem' }}>
            <Link to="/cart" style={{ fontWeight: 700, textDecoration: 'underline' }}>
              View Cart &rarr;
            </Link>
          </span>
        </Alert>
      )}

      {/* Main Product Layout */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {/* Product Image */}
          <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={product.image_url || DEFAULT_IMAGE}
              alt={product.name}
              style={{ width: '100%', height: 'auto', maxHeight: '450px', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_IMAGE;
              }}
            />
          </div>

          {/* Product Details & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <span className="product-category">{product.category}</span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.25, marginBottom: '1rem', color: 'var(--text-main)' }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                ${Number(product.price).toFixed(2)}
              </span>
              {isOutOfStock ? (
                <Badge variant="danger">Out of Stock</Badge>
              ) : stock <= 5 ? (
                <Badge variant="warning">Low Stock: {stock} units left</Badge>
              ) : (
                <Badge variant="success">In Stock ({stock} available)</Badge>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1.5rem 0', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Description</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {product.description || 'No detailed description provided for this catalog item.'}
              </p>
            </div>

            {/* Quantity Selector & Add to Cart */}
            {!isOutOfStock ? (
              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.25rem' }}>
                  <label htmlFor="quantity-input" style={{ fontWeight: 600, fontSize: '0.95rem' }}>Quantity:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)',
                        cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      -
                    </button>
                    <input
                      id="quantity-input"
                      type="number"
                      min="1"
                      max={stock}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setQuantity(Math.min(stock, Math.max(1, val)));
                      }}
                      style={{
                        width: '56px',
                        height: '36px',
                        textAlign: 'center',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        fontWeight: 600,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                      disabled={quantity >= stock}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)',
                        cursor: quantity >= stock ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      +
                    </button>
                  </div>
                  {inCartQty > 0 && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      ({inCartQty} currently in cart)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    size="lg"
                    style={{ flex: 1, minWidth: '200px' }}
                    onClick={handleAddToCart}
                    disabled={maxAvailable <= 0 && quantity > maxAvailable}
                  >
                    Add to Cart
                  </Button>
                  <Link to="/cart" className="btn btn-secondary btn-lg">
                    View Cart
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 'auto' }}>
                <Button variant="secondary" size="lg" disabled block>
                  Temporarily Out of Stock
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
