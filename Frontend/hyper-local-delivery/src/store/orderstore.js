import { create } from "zustand";
import API from "../api";

const useOrderStore = create((set) => ({

  orders: [],

  createOrder: async (formData) => {

    try {

      const response = await API.post(
        "/api/admin/create-order",
        formData
      );

      return response.data;

    } catch (error) {

      throw error.response.data;

    }

  },

}));

export default useOrderStore;