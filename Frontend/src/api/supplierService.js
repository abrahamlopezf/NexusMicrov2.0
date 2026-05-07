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
  }
};

export default supplierService;
