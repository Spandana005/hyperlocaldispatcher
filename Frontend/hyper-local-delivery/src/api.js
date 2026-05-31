import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000",
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
      console.log(`[API REQUEST INTERCEPTOR] Attached Bearer token to request: ${config.method.toUpperCase()} ${config.url}`);
    } else {
      console.log(`[API REQUEST INTERCEPTOR] No token in localStorage for request: ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error("[API REQUEST INTERCEPTOR] Request configuration error:", error);
    return Promise.reject(error);
  }
);


// ==========================
// HANDLE BLOCKING & SILENT REFRESH GLOBALLY
// ==========================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  console.log(`[API RESPONSE INTERCEPTOR] Processing failed queue of size ${failedQueue.length}. Success: ${!!token}`);
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If there is no response object (like network loss)
    if (!error.response) {
      console.error(`[API RESPONSE INTERCEPTOR] Network error occurred or server offline for request: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`);
      return Promise.reject(error);
    }

    console.warn(`[API RESPONSE INTERCEPTOR] Error status ${error.response.status} returned for: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`);

    // 1. Account Blocked
    if (error.response?.status === 403 && error.response?.data?.isBlocked) {
      console.warn("[API RESPONSE INTERCEPTOR] Account is blocked. Dispatching blocked event.");
      window.dispatchEvent(new CustomEvent("rider-blocked"));
      return Promise.reject(error);
    }

    // 2. Token Expired (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If refresh API itself fails, don't loop
      if (originalRequest.url === "/api/auth/refresh") {
        console.error("[API RESPONSE INTERCEPTOR] Token refresh failed directly. Rejecting request.");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        console.log(`[API RESPONSE INTERCEPTOR] Silent refresh is already in progress. Queuing request: ${originalRequest.url}`);
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      console.log(`[API RESPONSE INTERCEPTOR] 401 Unauthorized detected for ${originalRequest.url}. Starting silent refresh...`);
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          "http://localhost:4000/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        const newToken = refreshResponse.data.token;

        if (newToken) {
          console.log("[API RESPONSE INTERCEPTOR] Silent refresh succeeded. Updating token in localStorage and headers.");
          localStorage.setItem("token", newToken);
          // Sync backend profile to localStorage if returned
          if (refreshResponse.data.user) {
            localStorage.setItem("user", JSON.stringify(refreshResponse.data.user));
          }
          API.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

          processQueue(null, newToken);
          isRefreshing = false;

          console.log(`[API RESPONSE INTERCEPTOR] Retrying original request: ${originalRequest.url}`);
          return API(originalRequest);
        }
      } catch (refreshErr) {
        console.error("[API RESPONSE INTERCEPTOR] Silent refresh failed. Wiping tokens and logging out user.", refreshErr.message);
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
// SHOP APIs
// ==========================

// SAVE SHOP LOCATION
export const saveShopLocation =
  async (data) => {

    return API.post(

      "/api/shop/location",

      data

    );

};


// GET SHOP LOCATION
export const getShopLocation =
  async () => {

    return API.get(

      "/api/shop/location"

    );

};



// ==========================
// ADMIN APIs
// ==========================

// CREATE ORDER
export const createOrder =
  async (data) => {

    return API.post(

      "/api/admin/create-order",

      data

    );

};


// TRACK ORDER
export const trackOrder =
  async (orderId) => {

    return API.get(

      `/api/admin/track/${orderId}`

    );

};



// ==========================
// RIDER APIs
// ==========================

// GET AVAILABLE ORDERS
export const getAvailableOrders =
  async () => {

    return API.get(

      "/api/rider/available-orders"

    );

};


// GET MY ORDERS
export const getMyOrders =
  async () => {

    return API.get(

      "/api/rider/my-orders"

    );

};


// ACCEPT / REJECT ORDER
export const respondOrder =
  async (

    orderId,

    action

  ) => {

    return API.put(

      `/api/rider/respond-order/${orderId}`,

      { action }

    );

};


// UPDATE ORDER STATUS
export const updateOrderStatus =
  async (

    orderId,

    status

  ) => {

    return API.put(

      `/api/rider/update-status/${orderId}`,

      { status }

    );

};


// UPDATE LIVE LOCATION
export const updateLiveLocation =
  async (

    orderId,

    data

  ) => {

    return API.put(

      `/api/rider/update-location/${orderId}`,

      data

    );

};


export default API;