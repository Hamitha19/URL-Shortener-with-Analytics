const getBackendUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  // If we are on localhost, backend is on port 5000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  // If we are on a network IP, backend is on port 5000
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(window.location.hostname)) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  // Otherwise, assume production single-domain deployment
  return window.location.origin;
};

export const BACKEND_URL = getBackendUrl();
export const API_BASE_URL = `${BACKEND_URL}/api`;

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `API error: ${response.status} ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
};

export default apiFetch;
