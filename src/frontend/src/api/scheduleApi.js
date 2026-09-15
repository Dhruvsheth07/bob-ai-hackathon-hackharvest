import { apiClient } from './client';

export const scheduleApi = {
  // Returns paginated: { items, total, page, page_size }
  getSchedules: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const { data } = await apiClient.get(`/schedules${query ? `?${query}` : ''}`);
    return data;
  },

  getUpcoming: async (portId, limit = 10) => {
    const params = new URLSearchParams({ limit });
    if (portId) params.set('port_id', portId);
    const { data } = await apiClient.get(`/schedules/upcoming?${params}`);
    return data;
  },

  getSchedule: async (id) => {
    const { data } = await apiClient.get(`/schedules/${id}`);
    return data;
  },

  createSchedule: async (payload) => {
    const { data } = await apiClient.post('/schedules', payload);
    return data;
  },

  updateSchedule: async (id, payload) => {
    const { data } = await apiClient.put(`/schedules/${id}`, payload);
    return data;
  },

  deleteSchedule: async (id) => {
    const { data } = await apiClient.delete(`/schedules/${id}`);
    return data;
  },
};
