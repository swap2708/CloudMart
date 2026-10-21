import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from '../components/products/ProductGrid';
import ProductFilter from '../components/products/ProductFilter';
import ProductSearch from '../components/products/ProductSearch';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';

const PAGE_SIZE = 12;

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const minPriceParam = searchParams.get('min_price') || '';
  const maxPriceParam = searchParams.get('max_price') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const skip = (pageParam - 1) * PAGE_SIZE;

  const filterParams = useMemo(() => {
    const params = {
      skip,
      limit: PAGE_SIZE,
    };
    if (categoryParam) params.category = categoryParam;
    if (searchParam) params.search = searchParam;
    if (minPriceParam) params.min_price = Number(minPriceParam);
    if (maxPriceParam) params.max_price = Number(maxPriceParam);
    return params;
  }, [categoryParam, searchParam, minPriceParam, maxPriceParam, skip]);

  const { products, loading, error, refetch } = useProducts(filterParams);

  // Extract distinct categories from current catalog items or known set
  const categories = useMemo(() => {
    const defaultCategories = ['Electronics', 'Cloud Gear', 'Accessories', 'Storage'];
    const dynamic = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...defaultCategories, ...dynamic]));
  }, [products]);

  const updateUrlParams = (newEntries) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      Object.entries(newEntries).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') {
          updated.delete(k);
        } else {
          updated.set(k, String(v));
        }
      });
      return updated;
    });
  };

  const handleSearch = (keyword) => {
    updateUrlParams({ search: keyword, page: 1 });
  };

  const handleSelectCategory = (cat) => {
    updateUrlParams({ category: cat, page: 1 });
  };

  const handlePriceFilter = (min, max) => {
    updateUrlParams({ min_price: min, max_price: max, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  const handlePrevPage = () => {
    if (pageParam > 1) {
      updateUrlParams({ page: pageParam - 1 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    updateUrlParams({ page: pageParam + 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasMore = products.length === PAGE_SIZE;

  return (
    <div className="container">
      {/* Page Title & Search Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Product Catalog
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Browse our full inventory of verified hardware and cloud accessories.
        </p>
        <ProductSearch initialValue={searchParam} onSearch={handleSearch} />
      </div>

      {error && (
        <Alert variant="danger" onClose={refetch}>
          {error}
        </Alert>
      )}

      {/* Main Filter + Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Sidebar Filters */}
        <aside>
          <ProductFilter
            categories={categories}
            selectedCategory={categoryParam}
            onSelectCategory={handleSelectCategory}
            minPrice={minPriceParam}
            maxPrice={maxPriceParam}
            onPriceFilter={handlePriceFilter}
            onReset={handleResetFilters}
          />
        </aside>

        {/* Product Grid & Pagination */}
        <div>
          <ProductGrid
            products={products}
            loading={loading}
            emptyMessage="No products match your search or filter criteria. Try adjusting or clearing your filters."
          />

          {/* Pagination Controls */}
          {!loading && products.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '3rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrevPage}
                disabled={pageParam <= 1}
              >
                &larr; Previous Page
              </Button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Page {pageParam}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasMore}
              >
                Next Page &rarr;
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;

