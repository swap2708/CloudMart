import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '../api/products';

export const useProducts = (initialParams = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsApi.getProducts(params);
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err.response?.data?.detail || 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilters = (newFilters) => {
    setParams((prev) => ({
      ...prev,
      ...newFilters,
      skip: newFilters.skip !== undefined ? newFilters.skip : 0, // Reset to page 1 on filter changes unless skip explicitly provided
    }));
  };

  return {
    products,
    loading,
    error,
    params,
    setParams,
    updateFilters,
    refetch: fetchProducts,
  };
};
