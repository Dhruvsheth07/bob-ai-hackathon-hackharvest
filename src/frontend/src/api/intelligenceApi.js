import { apiClient } from './client';

export const intelligenceApi = {
  getCongestionData: async (portId = 1) => {
    // For now we assume portId 1. We also expect the backend to return { predictions, ... } 
    // We will extract predictions if necessary or pass the whole data.
    const { data } = await apiClient.get(`/predictions/congestion/forecast?port_id=${portId}`);
    return data;
  },
  getRecommendations: async () => {
    const { data } = await apiClient.get('/recommendations');
    // The backend might return { items: [...] }. Frontend expects an array.
    return data.items || data;
  }
};
