import axios from './axios';

const inventoryService = {
  // Materials
  getMaterials: async (params) => {
    const response = await axios.get('/materials', { params });
    return response.data;
  },
  createMaterial: async (data) => {
    const response = await axios.post('/materials', data);
    return response.data;
  },
  updateMaterial: async (id, data) => {
    const response = await axios.put(`/materials/${id}`, data);
    return response.data;
  },
  deleteMaterial: async (id) => {
    const response = await axios.delete(`/materials/${id}`);
    return response.data;
  },

  // Products
  getProducts: async (params) => {
    const response = await axios.get('/products', { params });
    return response.data;
  },
  getProductDetail: async (id) => {
    const response = await axios.get(`/products/${id}/full`);
    return response.data;
  },
  createProduct: async (payload) => {
    // payload should be { data, materials, costConfig }
    const response = await axios.post('/products', payload);
    return response.data;
  },
  updateProduct: async (id, payload) => {
    const response = await axios.put(`/products/${id}`, payload);
    return response.data;
  },

  // Inventory Movements & Adjustments
  getInventory: async (params) => {
    const response = await axios.get('/inventory', { params });
    return response.data;
  },
  adjustStock: async (data) => {
    // data should be { materialId, quantity, type, reason }
    const response = await axios.post('/inventory/adjust', data);
    return response.data;
  },
  getMovements: async (params) => {
    const response = await axios.get('/inventory/movements', { params });
    return response.data;
  },
  getPricingSettings: async () => {
    const response = await axios.get('/pricing/settings');
    return response.data;
  }
};

export default inventoryService;
