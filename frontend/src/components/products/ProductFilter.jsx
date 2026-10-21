import { useState, useEffect } from 'react';
import Button from '../ui/Button';

export const ProductFilter = ({
  categories = [],
  selectedCategory = '',
  onSelectCategory,
  minPrice = '',
  maxPrice = '',
  onPriceFilter,
  onReset,
}) => {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  useEffect(() => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
  }, [minPrice, maxPrice]);

  const handleApplyPrice = (e) => {
    e.preventDefault();
    onPriceFilter(localMin ? Number(localMin) : undefined, localMax ? Number(localMax) : undefined);
  };

  const handleResetAll = () => {
    setLocalMin('');
    setLocalMax('');
    onReset();
  };

  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Filter Catalog</h4>
        {(selectedCategory || minPrice || maxPrice) && (
          <button
            type="button"
            onClick={handleResetAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Reset All
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Category</label>
        <select
          className="form-control"
          value={selectedCategory}
          onChange={(e) => onSelectCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Filter */}
      <form onSubmit={handleApplyPrice}>
        <label className="form-label">Price Range ($)</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <input
            type="number"
            min="0"
            step="1"
            className="form-control"
            placeholder="Min"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
          />
          <span style={{ color: 'var(--text-light)' }}>-</span>
          <input
            type="number"
            min="0"
            step="1"
            className="form-control"
            placeholder="Max"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" size="sm" block>
          Apply Price
        </Button>
      </form>
    </div>
  );
};

export default ProductFilter;
