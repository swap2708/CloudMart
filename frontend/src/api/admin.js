import apiClient from './client';

export const adminApi = {
  /**
   * Fetch platform metrics and KPIs
   */
  getDashboardMetrics: async () => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  /**
   * List products (admin view - all products including inactive)
   * @param {{ skip?: number, limit?: number }} params
   */
  getProducts: async (params = {}) => {
    const response = await apiClient.get('/products', { params: { ...params, include_inactive: true } });
    return response.data;
  },

  /**
   * List all customer orders
   * @param {{ status?: string, skip?: number, limit?: number }} params
   */
  getAllOrders: async (params = {}) => {
    const response = await apiClient.get('/admin/orders', { params });
    return response.data;
  },

  /**
   * Update lifecycle status of an order
   * @param {number|string} orderId
   * @param {string} newStatus
   */
  updateOrderStatus: async (orderId, newStatus) => {
    const response = await apiClient.put(`/admin/orders/${orderId}/status`, {
      status: newStatus,
    });
    return response.data;
  },

  /**
   * Create a new product with initial stock
   * @param {{ name: string, description?: string, price: number, category: string, image_url?: string, initial_stock?: number }} productData
   */
  createProduct: async (productData) => {
    const response = await apiClient.post('/admin/products', productData);
    return response.data;
  },

  /**
   * Update existing product details
   * @param {number|string} productId
   * @param {object} productData
   */
  updateProduct: async (productId, productData) => {
    const response = await apiClient.put(`/admin/products/${productId}`, productData);
    return response.data;
  },

  /**
   * Delete or deactivate a product
   * @param {number|string} productId
   */
  deleteProduct: async (productId) => {
    const response = await apiClient.delete(`/admin/products/${productId}`);
    return response.data;
  },

  /**
   * Update stock inventory count for a product
   * @param {number|string} productId
   * @param {number} quantity
   */
  updateInventory: async (productId, quantity) => {
    const response = await apiClient.put(`/admin/products/${productId}/inventory`, {
      quantity: Number(quantity),
    });
    return response.data;
  },
};
