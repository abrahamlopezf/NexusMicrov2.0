import axios from './axios';

const quoteService = {
  getQuotes: async (params) => {
    try {
      const response = await axios.get('/quotes', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createQuote: async (data) => {
    try {
      const response = await axios.post('/quotes', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  approveQuote: async (id) => {
    try {
      const response = await axios.post(`/quotes/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  convertToSale: async (id, paymentData = null) => {
    try {
      const response = await axios.post(`/quotes/${id}/convert`, { paymentData });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default quoteService;
