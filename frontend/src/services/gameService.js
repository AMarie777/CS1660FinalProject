import { getToken } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper: Authorization header
function authHeaders() {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

// GET /game/range
export async function getTodayGame() {
  const res = await fetch(`${API_BASE_URL}/game/range`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch today's game");
  return res.json();
}

// GET /game/status
export async function getGameStatus() {
  const res = await fetch(`${API_BASE_URL}/game/status`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch game status");
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

  if (!res.ok) throw new Error("Failed to submit guess");
  return res.json();
}

// GET /user/points
export async function getUserPoints() {
  const res = await fetch(`${API_BASE_URL}/user/points`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!res.ok) throw new Error("Failed to fetch user points");
  return res.json();
}

// GET /model/metadata (unchanged)
export async function getModelMetadata() {
  const res = await fetch(`${API_BASE_URL}/model/metadata`);
  if (!res.ok) return null;
  return res.json();
}