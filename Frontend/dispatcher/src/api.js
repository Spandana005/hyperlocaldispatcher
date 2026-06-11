import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (import.meta.env.DEV
    ? "http://localhost:4000"
    : "https://hyperlocaldispatcher.onrender.com");

console.log("[API DEBUG] Resolved Axios baseURL:", API_BASE_URL);

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ==========================
// ADD TOKEN AUTOMATICALLY
// ==========================
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================
// HANDLE BLOCKING & SILENT REFRESH
// ==========================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    // Account Blocked
    if (error.response?.status === 403 && error.response?.data?.isBlocked) {
      window.dispatchEvent(new CustomEvent("rider-blocked"));
      return Promise.reject(error);
    }

    // Token Expired (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === "/api/auth/refresh") {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = refreshResponse.data.token;

        if (newToken) {
          localStorage.setItem("token", newToken);
          if (refreshResponse.data.user) {
            localStorage.setItem("user", JSON.stringify(refreshResponse.data.user));
          }
          API.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

          processQueue(null, newToken);
          isRefreshing = false;

          return API(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete API.defaults.headers.common["Authorization"];
        window.dispatchEvent(new CustomEvent("auth-expired"));

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// ==========================
// SHOP APIs (legacy)
// ==========================
export const saveShopLocation = (data) => API.post("/api/shop/location", data);
export const getShopLocation = () => API.get("/api/shop/location");

// ==========================
// ADMIN APIs (legacy)
// ==========================
export const createOrder = (data) => API.post("/api/admin/create-order", data);
export const trackOrder = (orderId) => API.get(`/api/admin/track/${orderId}`);

// ==========================
// ADMIN APIs (new)
// ==========================
export const getAdminStats = () => API.get("/api/admin/stats");
export const getAdminUsers = () => API.get("/api/admin/users");
export const getAdminShops = () => API.get("/api/admin/shops");
export const getAdminRiders = () => API.get("/api/admin/riders");
export const getAdminOrders = (params) => API.get("/api/admin/orders", { params });
export const blockUser = (userId) => API.patch(`/api/admin/block/${userId}`);
export const unblockUser = (userId) => API.patch(`/api/admin/unblock/${userId}`);

// ==========================
// SHOP OWNER APIs
// ==========================
export const createShop = (data) => API.post("/api/shop-owner/shop", data);
export const getMyShop = () => API.get("/api/shop-owner/shop");
export const updateMyShop = (data) => API.put("/api/shop-owner/shop", data);
export const getMyShopCode = () => API.get("/api/shop-owner/shop-code");
export const getShopOwnerStats = () => API.get("/api/shop-owner/stats");
export const getShopOwnerRiders = () => API.get("/api/shop-owner/riders");
export const getRiderRequests = (status = "Pending") =>
  API.get("/api/shop-owner/rider-requests", { params: { status } });
export const approveRider = (riderId) =>
  API.patch(`/api/shop-owner/rider/${riderId}/approve`);
export const rejectRider = (riderId) =>
  API.patch(`/api/shop-owner/rider/${riderId}/reject`);
export const getShopOwnerOrders = (params) =>
  API.get("/api/shop-owner/orders", { params });
export const createShopOwnerOrder = (data) =>
  API.post("/api/shop-owner/orders", data);
export const assignRiderToOrder = (orderId, riderId) =>
  API.put(`/api/shop-owner/orders/assign/${orderId}`, { riderId });
export const deleteShopOwnerOrder = (orderId) =>
  API.delete(`/api/shop-owner/orders/${orderId}`);
export const getRiderAnalytics = () =>
  API.get("/api/shop-owner/rider-analytics");

// ==========================
// ORDER APIs (shared)
// ==========================
export const getAllOrders = (params) => API.get("/api/orders", { params });
export const updateOrderStatus = (orderId, status) =>
  API.put(`/api/orders/status/${orderId}`, { status });

// ==========================
// RIDER APIs
// ==========================
export const getAvailableOrders = () => API.get("/api/rider/available-orders");
export const getMyOrders = () => API.get("/api/rider/my-orders");
export const respondOrder = (orderId, action) =>
  API.put(`/api/rider/respond-order/${orderId}`, { action });
export const updateRiderOrderStatus = (orderId, status) =>
  API.put(`/api/rider/update-status/${orderId}`, { status });
export const updateLiveLocation = (orderId, data) =>
  API.put(`/api/rider/update-location/${orderId}`, data);
export const joinShop = (shopCode) => API.post("/api/rider/join-shop", { shopCode });

// ==========================
// LOCATION APIs
// ==========================
export const updateLocationAPI = (data) => API.post("/api/location/update", data);
export const deactivateLocation = () => API.post("/api/location/deactivate");

// ==========================
// EARNINGS APIs
// ==========================
export const getEarnings = (riderId) => API.get(`/api/earnings/${riderId}`);

export default API;