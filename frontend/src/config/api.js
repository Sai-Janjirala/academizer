function inferApiBase() {
  if (typeof window === 'undefined') return 'http://localhost:5000/api';

  const { protocol, hostname, port, origin } = window.location;
  const devPorts = new Set(['5173', '4173']);

  if (devPorts.has(port)) {
    return `${protocol}//${hostname}:5000/api`;
  }

  return `${origin}/api`;
}

export const API_BASE = import.meta.env.VITE_API_URL || inferApiBase();
export const TOKEN_KEY = 'academizer_token';
