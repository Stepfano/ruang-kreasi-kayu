import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiBaseUrl = configuredApiUrl || (import.meta.env.DEV ? "http://localhost:4000/api" : "");

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error("VITE_API_URL belum diatur. Masukkan URL API Render sebelum deploy frontend.");
}

const api = axios.create({ baseURL: apiBaseUrl.replace(/\/+$/, "") });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ruang-kreasi-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const getProducts = async (params) => (await api.get("/products", { params })).data;
export const getProduct = async (id) => (await api.get(`/products/${id}`)).data.data;
export const loginUser = async (credentials) => (await api.post("/auth/login", credentials)).data;
export const registerUser = async (details) => (await api.post("/auth/register", details)).data;
export const requestPasswordReset = async (email) => (await api.post("/auth/forgot-password", { email })).data;
export const resetPassword = async (token, password) => (await api.post("/auth/reset-password", { token, password })).data;
export const getWishlist = async () => (await api.get("/account/wishlist")).data;
export const saveWishlist = async (productIds) => (await api.put("/account/wishlist", { productIds })).data;
export const getOrders = async () => (await api.get("/account/orders")).data;
export const createOrder = async (details) => (await api.post("/account/orders", details)).data;
export default api;
