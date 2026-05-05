import axios from './axios';

const clientService = {
  getClients: async (params) => {
    try {
      const response = await axios.get('/customers', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default clientService;
