import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api/products';
import ProductGrid from '../components/products/ProductGrid';
import Alert from '../components/ui/Alert';

export const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchFeatured = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await productsApi.getProducts({ limit: 8 });
        if (isMounted) setFeaturedProducts(data);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Failed to load featured products.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFeatured();
    return () => { isMounted = false; };
  }, []);

  const categories = [
    { name: 'Electronics', icon: '💻', count: 'Laptops, Monitors & Tech' },
    { name: 'Cloud Gear', icon: '☁️', count: 'Wearables & Apparel' },
    { name: 'Accessories', icon: '🎧', count: 'Peripherals & Audio' },
    { name: 'Storage', icon: '💾', count: 'SSDs, Cards & Drives' },
  ];

  return (
    <div className="container">
      {/* Hero Banner */}
      <section className="hero-section">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 className="hero-title">Cloud-Native Scale for Modern Commerce</h1>
          <p className="hero-subtitle">
            Discover cutting-edge developer gear, hardware, and cloud accessories.
            Engineered for reliability, instant fulfillment, and unbeatable performance.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/products" className="btn btn-secondary btn-lg" style={{ color: 'var(--primary)' }}>
              Explore Catalog &rarr;
            </Link>
            <Link to="/cart" className="btn btn-outline btn-lg" style={{ borderColor: '#fff', color: '#fff' }}>
              View Cart
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>⚡</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Instant Reservation</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Real-time atomic inventory checks prevent overselling and guarantee your orders.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>🔒</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Server-Side Integrity</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Prices calculated authoritatively on the server, ensuring pricing security.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>🚀</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Fast Global Delivery</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Streamlined order processing with simulated end-to-end status tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section style={{ marginBottom: '3.5rem' }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
          Shop by Category
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="card card-hover"
              style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}
            >
              <span style={{ fontSize: '2.25rem' }}>{cat.icon}</span>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>{cat.name}</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.count}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Featured Products
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Hand-picked cloud essentials ready to ship today.
            </p>
          </div>
          <Link to="/products" className="btn btn-outline btn-sm">
            View All &rarr;
          </Link>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <ProductGrid
          products={featuredProducts}
          loading={loading}
          emptyMessage="No products are available currently. Check back soon!"
        />
      </section>
    </div>
  );
};

export default HomePage;
