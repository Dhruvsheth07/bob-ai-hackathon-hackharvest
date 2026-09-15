import { apiClient } from './client';

export const vesselApi = {
  // Returns paginated: { items, total, page, page_size }
  getVessels: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const { data } = await apiClient.get(`/vessels${query ? `?${query}` : ''}`);
    return data;
  },

  getVessel: async (id) => {
    const { data } = await apiClient.get(`/vessels/${id}`);
    return data;
  },

  createVessel: async (payload) => {
    const { data } = await apiClient.post('/vessels', payload);
    return data;
  },

  updateVessel: async (id, payload) => {
    const { data } = await apiClient.put(`/vessels/${id}`, payload);
    return data;
  },

  deleteVessel: async (id) => {
    const { data } = await apiClient.delete(`/vessels/${id}`);
    return data;
  },
};
