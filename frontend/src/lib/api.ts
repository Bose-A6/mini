/**
 * Centralized API base URL resolver
 * - In local development: defaults to http://localhost:4000
 * - In production (Netlify / Vercel): defaults to same-origin relative path ('')
 * - Can be overridden anytime via VITE_API_URL environment variable
 */
export const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.replace(/\/+$/, '');
  }
  return import.meta.env.DEV ? 'http://localhost:4000' : '';
};

export const API_URL = getApiUrl();
