import axios from './axios';

const saleService = {
  getSales: async (params) => {
    try {
      const response = await axios.get('/sales', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSaleById: async (id) => {
    try {
      const response = await axios.get(`/sales/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createSale: async (data) => {
    try {
      const response = await axios.post('/sales', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPosSummary: async (id) => {
    try {
      const response = await axios.get(`/sales/${id}/pos-summary`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCostSummary: async (id) => {
    try {
      const response = await axios.get(`/sales/${id}/cost-summary`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default saleService;
