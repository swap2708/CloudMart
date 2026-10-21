import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

// Default SVG image placeholder for products without an image URL
const DEFAULT_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22225%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20225%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder%20text%20%7B%20fill%3A%2394a3b8%3Bfont-weight%3Abold%3Bfont-family%3AInter%2C%20sans-serif%3Bfont-size%3A18pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder%22%3E%3Crect%20width%3D%22300%22%20height%3D%22225%22%20fill%3D%22%23e2e8f0%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22100%22%20y%3D%22120%22%3ECloudMart%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";

export const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const stock = product.stock_quantity !== undefined ? product.stock_quantity : 0;
  const isOutOfStock = stock <= 0;
  const formattedPrice = Number(product.price).toFixed(2);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="card product-card card-hover">
      <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="product-image-wrap">
          <img
            src={product.image_url || DEFAULT_IMAGE}
            alt={product.name}
            className="product-image"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_IMAGE;
            }}
            loading="lazy"
          />
        </div>
      </Link>

      <div className="product-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <span className="product-category">{product.category}</span>
          {isOutOfStock ? (
            <Badge variant="danger">Out of Stock</Badge>
          ) : stock <= 5 ? (
            <Badge variant="warning">Only {stock} Left</Badge>
          ) : (
            <Badge variant="success">In Stock</Badge>
          )}
        </div>

        <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="product-title" title={product.name}>
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="product-desc">{product.description}</p>
        )}

        <div className="product-footer">
          <div className="product-price">${formattedPrice}</div>
          <Button
            size="sm"
            variant={justAdded ? 'secondary' : 'primary'}
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            {justAdded ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Added!
              </>
            ) : isOutOfStock ? (
              'Sold Out'
            ) : (
              'Add to Cart'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
