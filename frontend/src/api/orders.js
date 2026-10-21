import apiClient from './client';

export const ordersApi = {
  /**
   * Place a new order with atomic price & stock verification
   * @param {{ items: Array<{ product_id: number, quantity: number }> }} orderData
   */
  createOrder: async (orderData) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  /**
   * Checkout items directly via cart endpoint
   * @param {Array<{ product_id: number, quantity: number }>} items
   */
  checkoutCart: async (items) => {
    const response = await apiClient.post('/cart/checkout', items);
    return response.data;
  },

  /**
   * Validate cart items and retrieve live prices and stock availability
   * @param {Array<{ product_id: number, quantity: number }>} items
   */
  calculateCart: async (items) => {
    const response = await apiClient.post('/cart/calculate', items);
    return response.data;
  },

  /**
   * Get authenticated user's order history
   * @param {{ skip?: number, limit?: number }} params
   */
  getMyOrders: async (params = {}) => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  /**
   * Get order details by ID
   * @param {number|string} orderId
   */
  getOrderById: async (orderId) => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },
};
