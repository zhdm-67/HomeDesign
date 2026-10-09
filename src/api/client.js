// src/api/client.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'dom-po-stilyu-token';

// --- Работа с токеном ---
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// --- Базовая функция запроса ---
async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Автоматический logout при истёкшем токене
  if (res.status === 401) {
    clearToken();
    // Если мы не на странице логина — перебрасываем туда
    if (!window.location.pathname.startsWith('/auth')) {
      window.location.href = '/auth';
    }
  }

  // Пустой ответ (204)
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Ошибка ${res.status}`);
  }

  return data;
}

// --- API-модули ---

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login:    (payload) => request('/auth/login',    { method: 'POST', body: payload, auth: false }),
  me:       ()        => request('/auth/me'),
};

export const stylesApi = {
  list:    ()     => request('/styles', { auth: false }),
  getBySlug: (slug) => request(`/styles/${slug}`, { auth: false }),
};

export const projectsApi = {
  list:   ()         => request('/projects'),
  get:    (id)       => request(`/projects/${id}`),
  create: (payload)  => request('/projects', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/projects/${id}`, { method: 'PUT', body: payload }),
  remove: (id)       => request(`/projects/${id}`, { method: 'DELETE' }),
};