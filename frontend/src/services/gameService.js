/**
 * Game Service
 * 
 * This service handles all game-related API calls to the backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-api-gateway-url.execute-api.us-east-2.amazonaws.com/prod';

/**
 * Get today's game data including ML model predictions
 * @returns {Promise<{gameDate: string, symbol: string, modelPrediction: {predictedOpen: number, lower95: number, upper95: number}}>}
 */
export const getTodayGame = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/today`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch game data' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching today game:', error);
    throw error;
  }
};

/**
 * Get stock data from data_lambda (previous close, 52-week high/low, etc.)
 * @returns {Promise<{symbol: string, previousClose: number, latestOpen: number, latestHigh: number, latestLow: number, week52High: number, week52Low: number, date: string}>}
 */
export const getStockData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      throw new Error(errorData.message || errorData.error || `Failed to fetch stock data: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if response has an error field (from API Gateway error response)
    if (data.error) {
      throw new Error(data.message || data.error || 'Failed to fetch stock data');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
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
  try {
    const response = await fetch(`${API_BASE_URL}/guess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    return data;
  } catch (error) {
    console.error('Error submitting guess:', error);
    throw error;
  }
};

