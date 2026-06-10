import api from './axios';

const cashService = {
  openSession: (data) => api.post('/cash/open', data),
  getCurrentSession: () => api.get('/cash/current'),
  closeSession: (data) => api.post('/cash/close', data),
};

export default cashService;
