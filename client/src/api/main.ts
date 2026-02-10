import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/useAuthStore";

const apiUrl =
  import.meta.env.VITE_BASE_API_URL ||
  (() => {
    throw new Error("Api Url not found");
  })();

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/token/refresh")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const res = await api.post("/auth/token/refresh");
      const newToken = res.data.accessToken;
      useAuthStore.setState({ token: newToken });

      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (error) {
      console.log("Refresh Failed", error);
      useAuthStore.setState({ token: null });
      window.location.href = "/sign-in";

      return Promise.reject(error);
    }
  },
);
