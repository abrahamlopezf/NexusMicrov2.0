import axios from './axios';

const clientService = {
  getAllClients: async () => {
    const response = await axios.get('/customers');
    return response.data.data;
  },

  getClientById: async (id) => {
    const response = await axios.get(`/customers/${id}`);
    return response.data.data;
  },

  createClient: async (clientData) => {
    const response = await axios.post('/customers', clientData);
    return response.data.data;
  },

  updateClient: async (id, clientData) => {
    const response = await axios.put(`/customers/${id}`, clientData);
    return response.data.data;
  },

  deleteClient: async (id) => {
    const response = await axios.delete(`/customers/${id}`);
    return response.data.data;
  }
};

export default clientService;
