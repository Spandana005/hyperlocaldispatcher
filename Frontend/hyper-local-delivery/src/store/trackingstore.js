import { create } from "zustand";
import API from "../api";
import { toast } from "react-hot-toast";

const useTrackingStore = create((set, get) => {
  let latestCoords = null;

  return {
    // ======================
    // STATE
    // ======================
    watchId: null,
    intervalId: null,
    isTracking: false,
    activeOrderId: null,

    // ======================
    // ACTIONS
    // ======================
    startTracking: (orderId) => {
      const state = get();
      if (state.isTracking) {
        console.log(`[TRACKING STORE] Already tracking. Active Order: ${state.activeOrderId}. New request for Order: ${orderId} ignored.`);
        return;
      }

      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        console.error("[TRACKING STORE] Geolocation API not supported by browser");
        return;
      }

      console.log(`[TRACKING STORE] Starting live location tracking session for Order: ${orderId}`);
      toast.success("Live location tracking started");

      set({
        isTracking: true,
        activeOrderId: orderId,
      });

      // 1. Start navigator.geolocation.watchPosition to keep GPS active and receive coordinate changes
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          latestCoords = { latitude, longitude };
          console.log(`[TRACKING STORE] GPS watch update: Lat=${latitude}, Lng=${longitude}`);
        },
        (error) => {
          console.error("[TRACKING STORE] Geolocation watch error:", error.message);
          if (error.code === error.PERMISSION_DENIED) {
            toast.error("Location permission denied. Real-time dispatch tracking disabled.");
            get().stopTracking();
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // 2. Set interval to send the coordinates to backend every 10 seconds
      const intervalId = setInterval(async () => {
        const activeOrder = get().activeOrderId;
        if (!activeOrder) return;

        if (latestCoords) {
          try {
            console.log(`[TRACKING STORE] Syncing coords to backend: Lat=${latestCoords.latitude}, Lng=${latestCoords.longitude}, Order=${activeOrder}`);
            await API.post("/api/location/update", {
              latitude: latestCoords.latitude,
              longitude: latestCoords.longitude,
              orderId: activeOrder,
            });
          } catch (err) {
            console.error("[TRACKING STORE] Failed to upload location:", err.message);
          }
        } else {
          console.warn("[TRACKING STORE] GPS watch position is active but coordinates are not resolved yet");
        }
      }, 10000); // Send updates every 10 seconds

      set({
        watchId,
        intervalId,
      });
    },

    stopTracking: async () => {
      const { watchId, intervalId, isTracking, activeOrderId } = get();
      if (!isTracking) return;

      console.log(`[TRACKING STORE] Stopping live location tracking session for Order: ${activeOrderId}`);

      // 1. Clear Watch Position
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        console.log(`[TRACKING STORE] Cleared watchPosition: watchId=${watchId}`);
      }

      // 2. Clear Sync Interval
      if (intervalId !== null) {
        clearInterval(intervalId);
        console.log(`[TRACKING STORE] Cleared sendLocation interval`);
      }

      // 3. Reset internal variables
      latestCoords = null;

      // 4. Notify backend to clear active tracking session
      try {
        await API.post("/api/location/deactivate");
        console.log("[TRACKING STORE] Notified backend to deactivate location tracking session");
      } catch (err) {
        console.error("[TRACKING STORE] Failed to deactivate backend location:", err.message);
      }

      set({
        watchId: null,
        intervalId: null,
        isTracking: false,
        activeOrderId: null,
      });

      toast.success("Live location tracking stopped");
    },
  };
});

export default useTrackingStore;
