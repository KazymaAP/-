/**
 * Fitness Studio - API Client
 * Handles all API communications
 */

const API = {
  baseUrl: '/api',

  /**
   * Get auth headers
   * @returns {Object} Headers object
   */
  getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  /**
   * Generic fetch wrapper
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
      Auth.logout();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Server error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} Response data
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // ========== Schedule API ==========
  schedule: {
    /**
     * Get all schedule items
     * @returns {Promise<Object>} Schedule data
     */
    async getAll() {
      return API.get('/schedule');
    },

    /**
     * Get schedule for a week
     * @returns {Promise<Object>} Week schedule data
     */
    async getWeek() {
      return API.get('/schedule/week');
    },

    /**
     * Get schedule for a specific day
     * @param {number} day - Day of week (0-6)
     * @returns {Promise<Object>} Day schedule data
     */
    async getDay(day) {
      return API.get(`/schedule/day/${day}`);
    }
  },

  // ========== Trainers API ==========
  trainers: {
    /**
     * Get all trainers
     * @returns {Promise<Object>} Trainers data
     */
    async getAll() {
      return API.get('/trainers');
    },

    /**
     * Get trainer by ID
     * @param {string|number} id - Trainer ID
     * @returns {Promise<Object>} Trainer data
     */
    async getById(id) {
      return API.get(`/trainers/${id}`);
    }
  },

  // ========== Membership API ==========
  membership: {
    /**
     * Get all membership plans
     * @returns {Promise<Object>} Plans data
     */
    async getPlans() {
      return API.get('/membership/plans');
    },

    /**
     * Purchase a plan
     * @param {string|number} planId - Plan ID
     * @returns {Promise<Object>} Purchase result
     */
    async purchase(planId) {
      return API.post('/membership/purchase', { plan_id: planId });
    }
  },

  // ========== Booking API ==========
  booking: {
    /**
     * Book a training session
     * @param {Object} data - Booking data
     * @returns {Promise<Object>} Booking result
     */
    async create(data) {
      return API.post('/bookings', data);
    },

    /**
     * Get user's bookings
     * @returns {Promise<Object>} Bookings data
     */
    async getMyBookings() {
      return API.get('/bookings/my');
    },

    /**
     * Cancel a booking
     * @param {string|number} id - Booking ID
     * @returns {Promise<Object>} Cancel result
     */
    async cancel(id) {
      return API.delete(`/bookings/${id}`);
    }
  },

  // ========== Profile API ==========
  profile: {
    /**
     * Get current user profile
     * @returns {Promise<Object>} Profile data
     */
    async get() {
      return API.get('/profile');
    },

    /**
     * Update profile
     * @param {Object} data - Profile data
     * @returns {Promise<Object>} Updated profile
     */
    async update(data) {
      return API.put('/profile', data);
    }
  },

  // ========== Auth API ==========
  auth: {
    /**
     * Login user
     * @param {string} phone - Phone number
     * @param {string} password - Password
     * @returns {Promise<Object>} Auth result with token
     */
    async login(phone, password) {
      return API.post('/auth/login', { phone, password });
    },

    /**
     * Register user
     * @param {Object} data - Registration data
     * @returns {Promise<Object>} Auth result with token
     */
    async register(data) {
      return API.post('/auth/register', data);
    },

    /**
     * Refresh token
     * @returns {Promise<Object>} New token
     */
    async refresh() {
      return API.post('/auth/refresh');
    }
  }
};

// Export for use in other modules
window.API = API;

// Also support ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}