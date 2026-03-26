import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          await AsyncStorage.setItem('accessToken', data.tokens.accessToken);
          await AsyncStorage.setItem('refreshToken', data.tokens.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.tokens.accessToken}`;
          return api(originalRequest);
        } catch {
          await AsyncStorage.clear();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
