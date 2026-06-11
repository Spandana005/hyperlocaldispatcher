import { create } from "zustand";
import {
  joinShop as apiJoinShop,
  getAvailableOrders as apiGetAvailableOrders,
  getMyOrders as apiGetMyOrders,
  respondOrder as apiRespondOrder,
  updateRiderOrderStatus as apiUpdateRiderOrderStatus,
  updateLiveLocation as apiUpdateLiveLocation
} from "../api";

const useRiderStore = create((set, get) => ({
  availableOrders: [],
  myOrders: [],
  loading: false,
  error: null,

  joinShop: async (shopCode) => {
    set({ loading: true, error: null });
    try {
      const res = await apiJoinShop(shopCode);
      set({ loading: false });
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      set({ error: errMsg, loading: false });
      throw err.response?.data || err;
    }
  },

  fetchAvailableOrders: async () => {
    set({ loading: true });
    try {
      const res = await apiGetAvailableOrders();
      set({ availableOrders: res.data, loading: false });
    } catch (err) {
      set({ loading: false });
      console.error("Failed to fetch available orders:", err);
    }
  },

  fetchMyOrders: async () => {
    set({ loading: true });
    try {
      const res = await apiGetMyOrders();
      set({ myOrders: res.data, loading: false });
    } catch (err) {
      set({ loading: false });
      console.error("Failed to fetch my orders:", err);
    }
  },

  respondToOrder: async (orderId, action) => {
    try {
      const res = await apiRespondOrder(orderId, action);
      // Re-fetch orders after response
      get().fetchAvailableOrders();
      get().fetchMyOrders();
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },

  updateStatus: async (orderId, status) => {
    try {
      const res = await apiUpdateRiderOrderStatus(orderId, status);
      // Re-fetch my orders
      get().fetchMyOrders();
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
}));

export default useRiderStore;
