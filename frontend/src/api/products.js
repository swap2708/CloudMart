import apiClient from './client';

export const productsApi = {
  /**
   * Fetch products with optional filters
   * @param {{ category?: string, min_price?: number, max_price?: number, search?: string, skip?: number, limit?: number }} params
   */
  getProducts: async (params = {}) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  /**
   * Fetch product details by ID
   * @param {number|string} productId
   */
  getProductById: async (productId) => {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data;
  },
};
