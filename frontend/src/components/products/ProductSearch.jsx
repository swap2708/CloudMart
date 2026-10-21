import { useState, useEffect } from 'react';
import Button from '../ui/Button';

export const ProductSearch = ({ initialValue = '', onSearch }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search by product name or description..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-light)',
              fontSize: '1.25rem',
            }}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>
      <Button type="submit" variant="primary">
        Search
      </Button>
    </form>
  );
};

export default ProductSearch;
