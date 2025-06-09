// src/services/apiClient.ts
import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import useUserStore from "../store/useUserStore";

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

function processQueue(error: unknown | null, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
}

class APIClient {
  private client: AxiosInstance;

  constructor(baseURL: string, defaultHeaders: Record<string, string> = {}) {
    this.client = axios.create({
      baseURL,
      headers: defaultHeaders,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = useUserStore.getState().token;
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          localStorage.getItem("refreshToken")
        ) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({
                resolve: (token: string) => {
                  originalRequest.headers["Authorization"] = "Bearer " + token;
                  resolve(this.client(originalRequest));
                },
                reject,
              });
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshToken = localStorage.getItem("refreshToken");
            const response = await axios.post(`${baseURL}/auth/refresh-token`, {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } =
              response.data;
            localStorage.setItem("token", accessToken);
            localStorage.setItem("refreshToken", newRefreshToken);

            this.client.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${accessToken}`;
            processQueue(null, accessToken);
            return this.client(originalRequest);
          } catch (err) {
            processQueue(err, null);
            localStorage.clear(); // or just remove token keys
            window.location.href = "/login"; // Redirect to login page
            return Promise.reject(err);
          } finally {
            isRefreshing = false;
          }
        }
        // Handle other 401 errors (not refresh token related)
        if (error.response?.status === 401) {
          useUserStore.getState().logout();
          window.location.href = "/login";
        }
        console.error("❌ API Error:", error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(
    url: string,
    params: object = {},
    headers: object = {}
  ): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, { params, headers });
  }

  async post<T, D = unknown>(
    url: string,
    data: D = {} as D,
    headers: object = {}
  ): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, { headers });
  }

  async put<T, D = unknown>(
    url: string,
    data: D = {} as D,
    headers: object = {}
  ): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, { headers });
  }

  async patch<T, D = unknown>(
    url: string,
    data: D = {} as D,
    headers: object = {}
  ): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, { headers });
  }

  async delete<T>(
    url: string,
    options: {
      headers?: object;
      params?: object;
      data?: object;
    } = {}
  ): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, {
      headers: options.headers,
      params: options.params,
      data: options.data,
    });
  }
}

// const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const baseURL = "http://localhost:3000";
const apiClient = new APIClient(baseURL);

export default apiClient;
