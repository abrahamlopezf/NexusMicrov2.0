import { create } from "zustand";
import axios from "../api/axios";

export const useInventoryStore = create((set) => ({
  alerts: [],
  loading: false,
  error: null,

  fetchAlerts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/inventory/alerts");
      set({ alerts: response.data.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  resolveAlert: async (alertId) => {
    try {
      await axios.post(`/inventory/alerts/${alertId}/resolve`);
      set((state) => ({
        alerts: state.alerts.filter((a) => a.id !== alertId),
      }));
    } catch (error) {
      console.error("Failed to resolve alert", error);
    }
  },
}));
