// Change API_BASE_URL to your server IP when testing locally (e.g. 'http://192.168.1.50:3000')
// For production via Nginx / Cloudflare (web.geunix.com):

import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'https://web.geunix.com';
const TOKEN_KEY = 'safetag_token';

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Typed API wrapper
export async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

// ── Auth ──────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const res = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
  await saveToken(data.token);
  return data;
}

export async function register(nombre: string, email: string, password: string) {
  const res = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombre, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al registrarse');
  await saveToken(data.token);
  return data;
}

export async function verifyToken() {
  const res = await apiRequest('/api/auth/verify');
  if (!res.ok) throw new Error('Token inválido');
  return res.json();
}

// ── Tags ──────────────────────────────────────────────────────────────
export async function getTags() {
  const res = await apiRequest('/api/tags');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener tags');
  return data.tags;
}

export async function createTag(tagData: Record<string, string>) {
  const res = await apiRequest('/api/tags', {
    method: 'POST',
    body: JSON.stringify(tagData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear tag');
  return data.tag;
}

export async function updateTag(
  id: string,
  tagData: Record<string, string | boolean | number>
) {
  const res = await apiRequest(`/api/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tagData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar tag');
  return data.tag;
}

export async function deleteTag(id: string) {
  const res = await apiRequest(`/api/tags/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar tag');
  return data;
}

export async function getTagScans(id: string) {
  const res = await apiRequest(`/api/tags/${id}/scans`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener escaneos');
  return data;
}
