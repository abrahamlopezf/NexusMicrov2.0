import axios from './axios';

const productService = {
  getProducts: async (params) => {
    try {
      const response = await axios.get('/products', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default productService;
