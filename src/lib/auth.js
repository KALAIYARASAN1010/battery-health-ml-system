const API_BASE_URL = 'http://127.0.0.1:8000';
const SESSION_STORAGE_KEY = 'dms_auth_session';

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.detail || body?.message || 'Request failed';
    throw new Error(typeof message === 'string' ? message : 'Request failed');
  }
  return body;
}

export async function signup({ email, password, role }) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });
  return parseResponse(response);
}

export async function login({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse(response);
}

export async function logout() {
  const token = getAuthToken();
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function setSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getAuthToken() {
  return getSession()?.token || null;
}
