// src/services/gameService.js

import { getToken } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Always attach Authorization header with the user's email (token)
function authHeaders() {
  const token = getToken(); // token == email in our authService
  return token
    ? { Authorization: token } // IMPORTANT: plain email, no "Bearer "
    : {};
}

// GET /game/range
export async function getTodayGame() {
  const res = await fetch(`${API_BASE_URL}/game/range`, {
    method: "GET",
    headers: {
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch today's game");
  }

  return res.json();
}

// GET /game/status
export async function getGameStatus() {
  const res = await fetch(`${API_BASE_URL}/game/status`, {
    method: "GET",
    headers: {
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch game status");
  }

  return res.json();
}

// POST /game/guess
export async function submitUserGuess(guess) {
  const res = await fetch(`${API_BASE_URL}/game/guess`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ guess }),
  });

  if (!res.ok) {
    throw new Error("Failed to submit guess");
  }

  return res.json();
}

// GET /user/points
export async function getUserPoints() {
  const res = await fetch(`${API_BASE_URL}/user/points`, {
    method: "GET",
    headers: {
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user points");
  }

  return res.json();
}

// GET /model/metadata
export async function getModelMetadata() {
  const res = await fetch(`${API_BASE_URL}/model/metadata`, {
    method: "GET",
    headers: {
      // metadata endpoint doesn’t strictly need auth,
      // but sending it doesn’t hurt
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    // treat missing metadata as "no metadata" instead of hard error
    return null;
  }

  return res.json();
}