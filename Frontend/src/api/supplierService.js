import axios from './axios';

const supplierService = {
  getSuppliers: async () => {
    try {
      const response = await axios.get('/suppliers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createSupplier: async (data) => {
    try {
      const response = await axios.post('/suppliers', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateSupplier: async (id, data) => {
    try {
      const response = await axios.put(`/suppliers/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteSupplier: async (id) => {
    try {
      const response = await axios.delete(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // External Services
  getExternalServices: async (params) => {
    const response = await axios.get('/suppliers/external-services', { params });
    return response.data;
  },

  createExternalService: async (data) => {
    const response = await axios.post('/suppliers/external-services', data);
    return response.data;
  },

  getExternalServiceById: async (id) => {
    const response = await axios.get(`/suppliers/external-services/${id}`);
    return response.data;
  },

  updateExternalServiceStatus: async (id, data) => {
    const response = await axios.patch(`/suppliers/external-services/${id}/status`, data);
    return response.data;
  }
};

export default supplierService;
