// auth.js — Utilidades de autenticación compartidas

const API_BASE = '';

function getToken() {
  return localStorage.getItem('safetag_token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('safetag_user'));
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem('safetag_token');
  localStorage.removeItem('safetag_user');
  window.location.href = 'login.html';
}

function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
    return null;
  }
  return token;
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    return null;
  }

  return res;
}

// Exportar para uso en otros scripts
window.SafeTagAuth = { getToken, getUser, logout, requireAuth, apiRequest };
