import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h4 style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>CloudMart</h4>
            <p>
              A high-performance cloud-native e-commerce storefront powered by
              React, FastAPI, PostgreSQL, Docker, and Kubernetes.
            </p>
          </div>

          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/products?category=Electronics">Electronics</Link></li>
              <li><Link to="/products?category=Cloud%20Gear">Cloud Gear</Link></li>
              <li><Link to="/products?category=Accessories">Accessories</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Customer Care</h4>
            <ul>
              <li><Link to="/orders">Order History</Link></li>
              <li><Link to="/cart">Shopping Cart</Link></li>
              <li><Link to="/profile">My Account</Link></li>
              <li><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">API Documentation</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Architecture</h4>
            <ul>
              <li><span style={{ fontSize: '0.85rem' }}>Modular Monolith</span></li>
              <li><span style={{ fontSize: '0.85rem' }}>Stateless JWT Auth</span></li>
              <li><span style={{ fontSize: '0.85rem' }}>Server-Authoritative Pricing</span></li>
              <li><span style={{ fontSize: '0.85rem' }}>Docker & Kubernetes Ready</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} CloudMart Inc. All rights reserved. Built for cloud-native scale.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
