import { create } from "zustand";
import {
  createShop as apiCreateShop,
  getMyShop as apiGetMyShop,
  updateMyShop as apiUpdateMyShop,
  getShopOwnerStats as apiGetShopOwnerStats,
  getShopOwnerOrders as apiGetShopOwnerOrders,
  createShopOwnerOrder as apiCreateShopOwnerOrder,
  assignRiderToOrder as apiAssignRiderToOrder,
  deleteShopOwnerOrder as apiDeleteShopOwnerOrder,
  getShopOwnerRiders as apiGetShopOwnerRiders
} from "../api";

const useShopStore = create((set, get) => ({
  shop: null,
  orders: [],
  riders: [],
  stats: null,
  loading: false,
  error: null,

  fetchShop: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiGetMyShop();
      if (res.data?.success) {
        set({ shop: res.data.shop, loading: false });
        return res.data.shop;
      }
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  createShop: async (formData) => {
    set({ loading: true, error: null });
    try {
      const res = await apiCreateShop(formData);
      if (res.data?.success) {
        set({ shop: res.data.shop, loading: false });
        return res.data;
      }
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err.response?.data || err;
    }
  },

  updateShop: async (formData) => {
    set({ loading: true, error: null });
    try {
      const res = await apiUpdateMyShop(formData);
      if (res.data?.success) {
        set({ shop: res.data.shop, loading: false });
        return res.data;
      }
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err.response?.data || err;
    }
  },

  fetchStats: async () => {
    try {
      const res = await apiGetShopOwnerStats();
      if (res.data?.success) {
        set({ stats: res.data });
      }
    } catch (err) {
      console.error("Failed to fetch shop stats", err);
    }
  },

  fetchOrders: async (params = {}) => {
    set({ loading: true });
    try {
      const res = await apiGetShopOwnerOrders(params);
      if (res.data?.success) {
        set({ orders: res.data.orders, loading: false });
      }
    } catch (err) {
      set({ loading: false });
      console.error("Failed to fetch shop orders", err);
    }
  },

  fetchRiders: async () => {
    try {
      const res = await apiGetShopOwnerRiders();
      if (res.data?.success) {
        set({ riders: res.data.riders });
      }
    } catch (err) {
      console.error("Failed to fetch shop riders", err);
    }
  },

  createOrder: async (formData) => {
    try {
      const res = await apiCreateShopOwnerOrder(formData);
      if (res.data?.success) {
        set((state) => ({ orders: [res.data.order, ...state.orders] }));
        return res.data.order;
      }
    } catch (err) {
      throw err.response?.data || err;
    }
  },

  assignRider: async (orderId, riderId) => {
    try {
      const res = await apiAssignRiderToOrder(orderId, riderId);
      if (res.data?.success) {
        set((state) => ({
          orders: state.orders.map((o) => (o._id === orderId ? res.data.order : o)),
        }));
        return res.data.order;
      }
    } catch (err) {
      throw err.response?.data || err;
    }
  },

  deleteOrder: async (orderId) => {
    try {
      const res = await apiDeleteShopOwnerOrder(orderId);
      if (res.data?.success) {
        set((state) => ({ orders: state.orders.filter((o) => o._id !== orderId) }));
        return res.data;
      }
    } catch (err) {
      throw err.response?.data || err;
    }
  },
}));

export default useShopStore;
