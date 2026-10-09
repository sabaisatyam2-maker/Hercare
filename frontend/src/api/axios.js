import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Access token lives in memory only (never localStorage/sessionStorage).
let memoryAccessToken = null;
let refreshPromise = null;
let logoutCallback = null;

export const setAccessToken = (token) => { memoryAccessToken = token; };
export const setLogoutCallback = (cb) => { logoutCallback = cb; };

// Plain instance for refresh calls so the interceptor can never loop.
export const axiosPlain = axios.create({ baseURL: API_URL, withCredentials: true });

const api = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (memoryAccessToken) config.headers.Authorization = `Bearer ${memoryAccessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isExpired =
      error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED';

    if (isExpired && original && !original._retry) {
      original._retry = true;

      // One shared refresh for every request that expired at the same time.
      if (!refreshPromise) {
        refreshPromise = axiosPlain
          .post('/auth/refresh-token')
          .then((res) => {
            setAccessToken(res.data.accessToken);
            return res.data.accessToken;
          })
          .catch((err) => {
            setAccessToken(null);
            if (logoutCallback) logoutCallback();
            throw err;
          })
          .finally(() => { refreshPromise = null; });
      }

      try {
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
