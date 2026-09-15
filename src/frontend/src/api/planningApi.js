import { apiClient } from './client';
import { planningMock } from '../mocks/planningMock';

export const planningApi = {
  getOperationsPlan: async (portId = 1) => {
    try {
      const { data } = await apiClient.get(`/operations-plans?port_id=${portId}`);
      if (!data.items || data.items.length === 0) {
        return planningMock.operationsPlan; // fallback if no plans generated
      }
      const plan = data.items[0];
      
      // Group items by berth
      const berthMap = {};
      plan.items.forEach(item => {
        if (!berthMap[item.berth_id]) {
          berthMap[item.berth_id] = { berth: `Berth ${item.berth_id}`, vessels: [], cranes: item.assigned_cranes };
        }
        berthMap[item.berth_id].vessels.push(`Vessel ${item.vessel_schedule_id}`);
      });
      
      return {
        status: plan.status,
        generatedAt: plan.generated_at,
        summary: {
          vesselsServed: plan.summary_metrics.vessels_served || 0,
          totalMoves: plan.summary_metrics.total_moves || 0,
          berthUtilization: Math.round(plan.summary_metrics.average_berth_utilization * 100),
          craneUtilization: Math.round(plan.summary_metrics.average_crane_utilization * 100),
          congestionPeak: Math.round(plan.summary_metrics.peak_congestion_score)
        },
        allocations: Object.values(berthMap)
      };
    } catch (e) {
      console.warn("Failed to get operations plan from API, falling back to mock", e);
      return planningMock.operationsPlan;
    }
  },
  runSimulation: async (scenario) => {
    try {
      // Create simulation on backend
      const payload = {
        scenario_type: scenario,
        port_id: 1,
        time_horizon_hours: 72,
        parameters: {}
      };
      const { data } = await apiClient.post('/simulations', payload);
      
      return {
        avgWaitTime: `+${(data.metrics_delta.avg_wait_hours_delta || 0).toFixed(1)}h`,
        throughput: `No change`,
        congestionMax: data.simulated_metrics.max_congestion_score || 0,
        affectedVessels: ['Vessels in window'],
        mitigation: data.mitigation_recommendations?.[0] || 'No specific mitigation.'
      };
    } catch (e) {
      console.warn("Failed to run simulation via API, falling back to mock", e);
      return planningMock.simulation.simulatedResult;
    }
  },
  getSimulationContext: async () => {
    return planningMock.simulation; // For now keep the scenarios static
  }
};
