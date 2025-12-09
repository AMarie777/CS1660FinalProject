/**
 * Game Service
 * 
 * This service handles all game-related API calls to the backend.
 */

// API Base URL configuration
// Priority:
// 1. VITE_API_BASE_URL environment variable (for production/deployed API Gateway)
// 2. Use /api proxy for local development (configured in vite.config.js)
// 3. Fall back to mock data if neither is available

const getApiBaseUrl = () => {
  // If VITE_API_BASE_URL is set, use it directly (production)
  if (import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_BASE_URL.includes('your-api-gateway-url')) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // For local development, use proxy (if running dev server)
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Otherwise, return empty string to use mock data
  return '';
};

const API_BASE_URL = getApiBaseUrl();
const USE_MOCK_DATA = !API_BASE_URL || API_BASE_URL === '';

/**
 * Get authorization headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Mock data for development/demo purposes
 */
const MOCK_GAME_DATA = {
  gameDate: new Date().toISOString().slice(0, 10),
  symbol: 'NVDA',
  modelPrediction: {
    predictedOpen: 145.50,
    lower95: 142.30,
    upper95: 148.70,
  },
};

/**
 * Get today's game data including ML model predictions
 * @returns {Promise<{gameDate: string, symbol: string, modelPrediction: {predictedOpen: number, lower95: number, upper95: number}}>}
 */
export const getTodayGame = async () => {
  // Use mock data if API URL not configured
  if (USE_MOCK_DATA) {
    console.log('📦 Using mock game data - API_BASE_URL not configured');
    return MOCK_GAME_DATA;
  }

  try {
    const url = `${API_BASE_URL}/game/range`;
    console.log('🌐 Fetching game data from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch game data' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Successfully fetched game data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching today game:', error);
    // In development, fall back to mock data instead of throwing
    if (import.meta.env.DEV) {
      console.warn('⚠️ Falling back to mock data due to API error');
      return MOCK_GAME_DATA;
    }
    throw error;
  }
};

/**
 * Mock stock data for development
 */
const MOCK_STOCK_DATA = {
  symbol: 'NVDA',
  previousClose: 144.20,
  latestOpen: 145.10,
  latestHigh: 146.50,
  latestLow: 143.80,
  week52High: 150.00,
  week52Low: 110.00,
  date: new Date().toISOString().slice(0, 10),
};

/**
 * Get stock data from data_lambda (previous close, 52-week high/low, etc.)
 * @returns {Promise<{symbol: string, previousClose: number, latestOpen: number, latestHigh: number, latestLow: number, week52High: number, week52Low: number, date: string}>}
 */
export const getStockData = async () => {
  // Note: This endpoint may not exist yet in backend, using mock for now
  if (USE_MOCK_DATA) {
    return MOCK_STOCK_DATA;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/data`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      if (!data.error) {
        return data;
      }
    }
    
    // Fallback to mock data if endpoint doesn't exist
    console.warn('Stock data endpoint not available, using mock data');
    return MOCK_STOCK_DATA;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return MOCK_STOCK_DATA;
  }
};

/**
 * Submit a user's guess for today's game
 * @param {number} userGuess - The user's predicted opening price
 * @param {string} userId - The user's ID (from auth context)
 * @param {string} username - The user's name/username
 * @returns {Promise<{gameDate: string, username: string, botPrediction: number, actualOpen: number|null, userError: number|null, botError: number|null, didUserBeatBot: boolean|null}>}
 */
export const submitUserGuess = async (userGuess, userId, username) => {
  // Use mock/localStorage if API not configured
  if (USE_MOCK_DATA) {
    console.log('📦 Using mock storage for guess submission');
    const gameDate = new Date().toISOString().slice(0, 10);
    const botPrediction = 145.50;
    
    const mockResult = {
      gameDate,
      username,
      userGuess,
      botPrediction,
      actualOpen: null,
      userError: null,
      botError: null,
      didUserBeatBot: null,
    };
    
    const guesses = JSON.parse(localStorage.getItem('userGuesses') || '[]');
    guesses.push(mockResult);
    localStorage.setItem('userGuesses', JSON.stringify(guesses));
    
    return mockResult;
  }

  try {
    const url = `${API_BASE_URL}/game/guess`;
    console.log('🌐 Submitting guess to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        userGuess,
        userId,
        username,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to submit guess' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Successfully submitted guess:', data);
    return data;
  } catch (error) {
    console.error('❌ Error submitting guess:', error);
    throw error;
  }
};

/**
 * Get leaderboard for a specific game date
 * @param {string} gameDate - Optional game date (YYYY-MM-DD), defaults to today
 * @returns {Promise<{gameDate: string, leaderboard: Array}>}
 */
export const getLeaderboard = async (gameDate = null) => {
  // Use localStorage if API not configured
  if (USE_MOCK_DATA) {
    const targetDate = gameDate || new Date().toISOString().slice(0, 10);
    const guesses = JSON.parse(localStorage.getItem('userGuesses') || '[]');
    const dateGuesses = guesses.filter(g => g.gameDate === targetDate && g.userError !== null);
    
    dateGuesses.sort((a, b) => a.userError - b.userError);
    
    const leaderboard = dateGuesses.slice(0, 20).map((g, i) => ({
      rank: i + 1,
      username: g.username,
      userError: g.userError,
      botError: g.botError,
      didUserBeatBot: g.didUserBeatBot,
    }));
    
    return {
      gameDate: targetDate,
      leaderboard,
    };
  }

  try {
    const url = gameDate 
      ? `${API_BASE_URL}/leaderboard?gameDate=${gameDate}`
      : `${API_BASE_URL}/leaderboard`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch leaderboard' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

/**
 * Get game status (user guess, predictions, score)
 * @returns {Promise<{gameDate: string, userGuess: number|null, modelPrediction: object, userPoints: number}>}
 */
export const getGameStatus = async () => {
  // Use localStorage if API not configured
  if (USE_MOCK_DATA) {
    const gameDate = new Date().toISOString().slice(0, 10);
    const guesses = JSON.parse(localStorage.getItem('userGuesses') || '[]');
    const todayGuess = guesses.find(g => g.gameDate === gameDate);
    
    return {
      gameDate,
      userGuess: todayGuess?.userGuess || null,
      modelPrediction: MOCK_GAME_DATA.modelPrediction,
      userPoints: guesses.filter(g => g.didUserBeatBot === true).length,
      actualOpen: todayGuess?.actualOpen || null,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/game/status`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch game status' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching game status:', error);
    throw error;
  }
};

/**
 * Get user points
 * @returns {Promise<{points: number}>}
 */
export const getUserPoints = async () => {
  // Use localStorage if API not configured
  if (USE_MOCK_DATA) {
    const guesses = JSON.parse(localStorage.getItem('userGuesses') || '[]');
    const points = guesses.filter(g => g.didUserBeatBot === true).length;
    return { points };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/points`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch user points' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user points:', error);
    throw error;
  }
};

/**
 * Mock model metadata with top 8 metrics
 */
const MOCK_MODEL_METADATA = {
  topMetrics: {
    'Close_NVDA_lag3': { value: 144.20, importance: 1 },
    'EMA_12_NVDA': { value: 143.85, importance: 2 },
    'Close_^GSPC_lag3': { value: 5420.50, importance: 3 },
    'ES_High': { value: 5440.00, importance: 4 },
    'NVDA_vs_SP500_C': { value: 2.66, importance: 5 },
    'NVDA_vs_SP500_C_lag3': { value: 2.64, importance: 6 },
    'Low_NVDA': { value: 143.10, importance: 7 },
    'High_^GSPC': { value: 5435.00, importance: 8 },
  },
  featureImportance: [
    { name: 'Close_NVDA_lag3', importance: 8.5 },
    { name: 'EMA_12_NVDA', importance: 7.2 },
    { name: 'Close_^GSPC_lag3', importance: 6.8 },
    { name: 'ES_High', importance: 6.1 },
    { name: 'NVDA_vs_SP500_C', importance: 5.9 },
    { name: 'NVDA_vs_SP500_C_lag3', importance: 5.4 },
    { name: 'Low_NVDA', importance: 5.0 },
    { name: 'High_^GSPC', importance: 4.8 },
  ],
};

/**
 * Get model metadata (top metrics, feature importance, etc.)
 * @returns {Promise<{topMetrics: Array, featureImportance: Array, externalLinks: object}>}
 */
export const getModelMetadata = async () => {
  // Use mock data if API not configured
  if (USE_MOCK_DATA) {
    return MOCK_MODEL_METADATA;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/model/metadata`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch model metadata' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching model metadata:', error);
    // Return mock data as fallback if API fails
    return MOCK_MODEL_METADATA;
  }
};

