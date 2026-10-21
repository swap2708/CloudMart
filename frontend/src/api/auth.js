import apiClient from './client';

export const authApi = {
  /**
   * Register a new user account
   * @param {{ email: string, full_name: string, password: string }} data
   */
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  /**
   * Log in user and receive JWT access token
   * @param {{ email: string, password: string }} credentials
   */
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Fetch current authenticated user details
   */
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
