import { create } from "zustand";
import {
  getRiderRequests as apiGetRiderRequests,
  approveRider as apiApproveRider,
  rejectRider as apiRejectRider
} from "../api";

const useApprovalStore = create((set, get) => ({
  pendingRequests: [],
  rejectedRequests: [],
  loading: false,

  fetchRequests: async (status = "Pending") => {
    set({ loading: true });
    try {
      const res = await apiGetRiderRequests(status);
      if (res.data?.success) {
        if (status === "Pending") {
          set({ pendingRequests: res.data.riders, loading: false });
        } else if (status === "Rejected") {
          set({ rejectedRequests: res.data.riders, loading: false });
        }
      }
    } catch (err) {
      set({ loading: false });
      console.error(`Failed to fetch rider requests (${status}):`, err);
    }
  },

  approveRider: async (riderId) => {
    try {
      const res = await apiApproveRider(riderId);
      if (res.data?.success) {
        // Remove from pending lists
        set((state) => ({
          pendingRequests: state.pendingRequests.filter((r) => r._id !== riderId),
        }));
        return res.data;
      }
    } catch (err) {
      throw err.response?.data || err;
    }
  },

  rejectRider: async (riderId) => {
    try {
      const res = await apiRejectRider(riderId);
      if (res.data?.success) {
        // Remove from pending and move to rejected
        set((state) => ({
          pendingRequests: state.pendingRequests.filter((r) => r._id !== riderId),
          rejectedRequests: [res.data.rider, ...state.rejectedRequests],
        }));
        return res.data;
      }
    } catch (err) {
      throw err.response?.data || err;
    }
  },
}));

export default useApprovalStore;
