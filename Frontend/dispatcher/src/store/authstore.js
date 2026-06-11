import { create } from "zustand";
import API from "../api";

// Initialize credentials from localStorage on boot
const storedToken = localStorage.getItem("token");
let storedUser = null;

try {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    storedUser = JSON.parse(userStr);
    console.log("[AUTH STARTUP] Restored user details from localStorage:", storedUser);
  }
} catch (e) {
  console.error("[AUTH STARTUP] Failed to parse cached user:", e);
}

if (storedToken) {
  console.log("[AUTH STARTUP] Found token in localStorage. Pre-configuring API Authorization Header.");
  API.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
} else {
  console.log("[AUTH STARTUP] No token found in localStorage.");
}

const useAuthStore = create((set, get) => ({

  // ======================
  // STATE
  // ======================
  user: storedUser,
  isCheckingAuth: !!storedToken, // If we have a token, we check its validity

  // ======================
  // REGISTER
  // ======================
  register: async (formData) => {
    try {
      console.log("[AUTH STORE] Registering new account with body:", formData.email);
      console.log("[AUTH STORE] Axios baseURL:", API.defaults.baseURL);
      console.log("[AUTH STORE] Full register URL:", `${API.defaults.baseURL}/api/auth/register`);
      const response = await API.post(
        "/api/auth/register",
        formData
      );
      console.log("[AUTH STORE] Registration successful");
      return response.data;
    } catch (error) {
      console.error("[AUTH STORE] Registration failed:", error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  // ======================
  // LOGIN
  // ======================
  login: async (formData) => {
    try {
      console.log("[AUTH STORE] Login requested for email:", formData.email);
      const response = await API.post(
        "/api/auth/login",
        formData
      );

      // SAVE TOKEN & USER IN LOCAL STORAGE FOR PERSISTENCE
      if (response.data.token) {
        console.log("[AUTH STORE] Login success. Storing credentials in localStorage.");
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        API.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
      }

      // SAVE USER IN STATE
      set({
        user: response.data.user,
        isCheckingAuth: false,
      });

      console.log("[AUTH STORE] User state updated in Zustand:", response.data.user);
      return response.data;
    } catch (error) {
      console.error("[AUTH STORE] Login request error:", error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  // ======================
  // CHECK AUTH
  // ======================
  checkAuth: async () => {
    const token = localStorage.getItem("token");
    console.log("[AUTH STORE] checkAuth triggered. Token in localStorage:", token ? "YES" : "NO");

    if (!token) {
      console.log("[AUTH STORE] checkAuth: No token found. Resetting user state.");
      localStorage.removeItem("user");
      set({
        user: null,
        isCheckingAuth: false,
      });
      return;
    }

    // Set checking state to true if we don't have a cached user, to prevent full-screen layout flashing
    const hasCachedUser = !!get().user;
    if (!hasCachedUser) {
      set({ isCheckingAuth: true });
    }

    try {
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log("[AUTH STORE] checkAuth: Requesting backend verify endpoint `/api/auth/me`...");
      const response = await API.get("/api/auth/me");

      console.log("[AUTH STORE] checkAuth: Server responded with profile details. Syncing localStorage.");
      localStorage.setItem("user", JSON.stringify(response.data));
      set({
        user: response.data,
        isCheckingAuth: false,
      });
    } catch (error) {
      console.error("[AUTH STORE] checkAuth API query error:", error);

      // Check if it is a true authentication error (401 Unauthorized or 403 Forbidden/Blocked)
      const status = error.response?.status;
      const isAuthFailure = status === 401 || status === 403;

      if (isAuthFailure) {
        console.warn("[AUTH STORE] true auth failure detected (401/403). Cleaning credentials from memory/storage.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete API.defaults.headers.common["Authorization"];
        set({
          user: null,
          isCheckingAuth: false,
        });
      } else {
        console.warn("[AUTH STORE] network or server-side error. Retaining cached user session locally.");
        set({
          isCheckingAuth: false,
        });
      }
    }
  },

  // ======================
  // LOGOUT
  // ======================
  logout: async () => {
    console.log("[AUTH STORE] Logout sequence initiated.");
    try {
      await API.post(
        "/api/auth/logout"
      );
      console.log("[AUTH STORE] Notified backend of logout.");
    } catch (error) {
      console.error("[AUTH STORE] Backend logout endpoint failed:", error);
    }

    console.log("[AUTH STORE] Clearing tokens and cached data from localStorage.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete API.defaults.headers.common["Authorization"];
    set({
      user: null,
      isCheckingAuth: false,
    });
  },

}));

export default useAuthStore;