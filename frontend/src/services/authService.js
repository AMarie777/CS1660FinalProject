/**
 * Authentication Service
 * 
 * This service handles all authentication-related API calls.
 * Replace the placeholder implementations with actual backend endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user: object, token: string}>}
 */
export const login = async (email, password) => {
  // TODO: Replace with actual backend endpoint
  // Example implementation:
  /*
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  return data;
  */

  // Placeholder for development
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email && password) {
        resolve({
          user: { id: '1', email, name: 'Test User' },
          token: 'mock-jwt-token',
        });
      } else {
        reject(new Error('Email and password are required'));
      }
    }, 1000);
  });
};

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User name (optional)
 * @returns {Promise<{user: object, token: string}>}
 */
export const signup = async (email, password, name = '') => {
  // TODO: Replace with actual backend endpoint
  // Example implementation:
  /*
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Signup failed');
  }

  const data = await response.json();
  return data;
  */

  // Placeholder for development
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email && password) {
        resolve({
          user: { id: '1', email, name: name || 'New User' },
          token: 'mock-jwt-token',
        });
      } else {
        reject(new Error('Email and password are required'));
      }
    }, 1000);
  });
};

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  // TODO: Replace with actual backend endpoint if needed
  // Example implementation:
  /*
  const token = localStorage.getItem('token');
  if (token) {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }
  */

  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Verify if the current token is valid
 * @returns {Promise<{user: object}>}
 */
export const verifyToken = async () => {
  // TODO: Replace with actual backend endpoint
  // Example implementation:
  /*
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Token verification failed');
  }

  const data = await response.json();
  return data;
  */

  // Placeholder for development
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    return { user: JSON.parse(user) };
  }
  
  throw new Error('No valid token found');
};

/**
 * Get the current user from localStorage
 * @returns {object|null}
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Get the current token from localStorage
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

