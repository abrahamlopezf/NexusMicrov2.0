import axios from './axios';

const productionService = {
  getWorkOrders: async (params) => {
    try {
      const response = await axios.get('/workorders', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createWorkOrder: async (data) => {
    try {
      const response = await axios.post('/workorders', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  startProduction: async (id) => {
    try {
      const response = await axios.post(`/production/${id}/start`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  completeProduction: async (id) => {
    try {
      const response = await axios.post(`/production/${id}/complete`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default productionService;
