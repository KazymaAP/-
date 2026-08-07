/**
 * Fitness Studio - Authentication Module
 * Handles user authentication state and operations
 */

const Auth = {
  /**
   * Get stored auth token
   * @returns {string|null} Auth token
   */
  getToken() {
    return localStorage.getItem('auth_token');
  },

  /**
   * Store auth token
   * @param {string} token - Auth token
   */
  setToken(token) {
    localStorage.setItem('auth_token', token);
  },

  /**
   * Remove auth token
   */
  removeToken() {
    localStorage.removeItem('auth_token');
  },

  /**
   * Get stored user data
   * @returns {Object|null} User data
   */
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Store user data
   * @param {Object} user - User data
   */
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Remove user data
   */
  removeUser() {
    localStorage.removeItem('user');
  },

  /**
   * Check if user is logged in
   * @returns {boolean} True if logged in
   */
  isLoggedIn() {
    return !!this.getToken();
  },

  /**
   * Login user
   * @param {string} phone - Phone number
   * @param {string} password - Password
   * @returns {Promise<Object>} Auth result
   */
  async login(phone, password) {
    const result = await API.auth.login(phone, password);
    if (result.token) {
      this.setToken(result.token);
      this.setUser(result.user);
    }
    return result;
  },

  /**
   * Register user
   * @param {Object} data - Registration data
   * @returns {Promise<Object>} Auth result
   */
  async register(data) {
    const result = await API.auth.register(data);
    if (result.token) {
      this.setToken(result.token);
      this.setUser(result.user);
    }
    return result;
  },

  /**
   * Logout user
   * @param {string} redirect - Redirect URL after logout
   */
  logout(redirect = '/') {
    this.removeToken();
    this.removeUser();
    window.location.href = redirect;
  },

  /**
   * Initialize auth state (update UI)
   */
  init() {
    this.updateAuthUI();
    this.bindLogout();
  },

  /**
   * Update authentication UI elements
   */
  updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const profileBtn = document.getElementById('profileBtn');

    if (this.isLoggedIn()) {
      const user = this.getUser();
      if (authBtn) {
        authBtn.classList.add('hidden');
      }
      if (profileBtn) {
        profileBtn.classList.remove('hidden');
      }
    } else {
      if (authBtn) {
        authBtn.classList.remove('hidden');
      }
      if (profileBtn) {
        profileBtn.classList.add('hidden');
      }
    }
  },

  /**
   * Bind logout button
   */
  bindLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  },

  /**
   * Require authentication (redirect if not logged in)
   * @param {string} redirect - Redirect URL
   * @returns {boolean} True if authenticated
   */
  requireAuth(redirect = '/login') {
    if (!this.isLoggedIn()) {
      window.location.href = `${redirect}?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }
    return true;
  }
};

// Export for use in other modules
window.Auth = Auth;

// Also support ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}