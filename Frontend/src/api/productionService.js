import axios from './axios';

const productionService = {
  // ---- Work Orders ----
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

  getWorkOrderById: async (id) => {
    try {
      const response = await axios.get(`/workorders/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateWorkOrderStatus: async (id, status) => {
    try {
      const response = await axios.put(`/workorders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  assignWorkOrder: async (id, employeeId) => {
    try {
      const response = await axios.post(`/workorders/${id}/assign`, { employeeId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ---- Production ----
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
  },

  getProductionStatus: async (id) => {
    try {
      const response = await axios.get(`/production/${id}/status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getGarments: async (params) => {
    try {
      const response = await axios.get('/production/garments', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getQueue: async () => {
    try {
      const response = await axios.get('/production/queue');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default productionService;
