import ProductCard from './ProductCard';
import Spinner from '../ui/Spinner';

export const ProductGrid = ({
  products = [],
  loading = false,
  emptyMessage = 'No products found matching your criteria.',
}) => {
  if (loading) {
    return <Spinner center text="Loading products catalog..." />;
  }

  if (!products || products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#128722;</div>
        <h3>No Products Found</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
