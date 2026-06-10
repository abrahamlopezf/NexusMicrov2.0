import axios from './axios';

const purchaseService = {
  getPurchaseOrders: async (params) => {
    try {
      const response = await axios.get('/suppliers/purchases', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createPurchaseOrder: async (data) => {
    try {
      const response = await axios.post('/suppliers/purchases/materials', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPurchaseById: async (id) => {
    try {
      const response = await axios.get(`/suppliers/purchases/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default purchaseService;
