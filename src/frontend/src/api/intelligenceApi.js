import { apiClient } from './client';

export const intelligenceApi = {
  /**
   * Fetch the latest forecast for a port.
   * Backend: GET /predictions/congestion/forecast?port_id=N&horizon_hours=N
   * Returns: { port_id, port_name, generated_at, horizon_hours, predictions: [...] }
   */
  getForecast: async (portId = 1, horizonHours = 72) => {
    const { data } = await apiClient.get(
      `/predictions/congestion/forecast?port_id=${portId}&horizon_hours=${horizonHours}`
    );
    return data;
  },

  /**
   * Trigger generation of a new congestion forecast.
   * Backend: POST /predictions/congestion
   * Returns: ForecastResponse (same shape as getForecast)
   */
  generateForecast: async (portId = 1, horizonHours = 72, intervalHours = 1) => {
    const { data } = await apiClient.post('/predictions/congestion', {
      port_id: portId,
      horizon_hours: horizonHours,
      interval_hours: intervalHours,
    });
    return data;
  },

  /**
   * List stored predictions (paginated).
   * Backend: GET /predictions/congestion
   * Returns: { items: [...], total, page, page_size, pages }
   */
  getPredictions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const { data } = await apiClient.get(`/predictions/congestion${query ? `?${query}` : ''}`);
    return data;
  },

  getRecommendations: async () => {
    const { data } = await apiClient.get('/recommendations');
    return Array.isArray(data) ? data : data.items ?? [];
  },
};
