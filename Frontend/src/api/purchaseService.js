import axios from './axios';

const purchaseService = {
  getPurchaseOrders: async (params) => {
    try {
      const response = await axios.get('/purchases', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createPurchaseOrder: async (data) => {
    try {
      const response = await axios.post('/purchases', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  receivePurchaseOrder: async (id) => {
    try {
      const response = await axios.post(`/purchases/${id}/receive`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default purchaseService;
