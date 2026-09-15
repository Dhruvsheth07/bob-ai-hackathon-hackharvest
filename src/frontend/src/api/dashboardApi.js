import { apiClient } from './client';
import { dashboardMock } from '../mocks/dashboardMock';

export const dashboardApi = {
  getDashboardData: async () => {
    try {
      const [vesselsRes, schedulesRes, recommendationsRes] = await Promise.all([
        apiClient.get('/vessels'),
        apiClient.get('/schedules'),
        apiClient.get('/recommendations')
      ]);

      const vessels = vesselsRes.data.items || [];
      const schedules = schedulesRes.data.items || [];
      const recommendations = recommendationsRes.data.items || [];

      // Build queue from schedules
      const vesselQueue = schedules.map(s => {
        const v = vessels.find(v => v.id === s.vessel_id) || {};
        return {
          id: v.name || `V-${s.vessel_id}`,
          name: v.name || 'Unknown',
          type: v.vessel_type || 'Unknown',
          eta: new Date(s.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          status: s.status
        };
      }).slice(0, 5);

      const recs = recommendations.map(r => ({
        id: r.id,
        type: r.priority === 'HIGH' ? 'Critical' : 'Warning',
        text: r.description
      })).slice(0, 3);

      return {
        ...dashboardMock,
        kpis: {
          ...dashboardMock.kpis,
          activeVessels: vessels.length,
          vesselsWaiting: schedules.filter(s => s.status === 'WAITING').length
        },
        vesselQueue: vesselQueue.length > 0 ? vesselQueue : dashboardMock.vesselQueue,
        recommendations: recs.length > 0 ? recs : dashboardMock.recommendations
      };
    } catch (e) {
      console.warn("Failed to get dashboard data, using mock", e);
      return dashboardMock;
    }
  }
};
