export const planningMock = {
  operationsPlan: {
    status: 'Draft',
    generatedAt: '2026-09-14T21:00:00Z',
    summary: {
      vesselsServed: 12,
      totalMoves: 8400,
      berthUtilization: 88,
      craneUtilization: 82,
      congestionPeak: 68
    },
    allocations: [
      { berth: 'Berth 1', vessels: ['MSC Isabella', 'Ever Given'], cranes: 3 },
      { berth: 'Berth 2', vessels: ['CMA CGM Antoine'], cranes: 2 },
      { berth: 'Berth 3', vessels: ['Maersk Mc-Kinney'], cranes: 2 },
    ]
  },
  simulation: {
    scenarios: ['Berth Unavailable', 'Crane Unavailable', 'Vessel Delay', 'Increased Arrivals'],
    defaultBaseline: {
      avgWaitTime: '4.2h',
      throughput: '340 moves/h',
      congestionMax: 78
    },
    simulatedResult: {
      avgWaitTime: '8.5h',
      throughput: '280 moves/h',
      congestionMax: 94,
      affectedVessels: ['MSC Isabella', 'Ever Given'],
      mitigation: 'Activate emergency berth 4 and recall off-duty crane operators.'
    }
  }
};
