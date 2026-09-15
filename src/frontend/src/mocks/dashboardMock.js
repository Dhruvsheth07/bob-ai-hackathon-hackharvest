export const dashboardMock = {
  kpis: {
    activeVessels: 14,
    vesselsWaiting: 6,
    berthUtilization: 82,
    craneUtilization: 78,
    congestionScore: 65,
    avgWaitTime: "4.2h"
  },
  congestionHistory: [
    { time: '00:00', score: 45 },
    { time: '04:00', score: 52 },
    { time: '08:00', score: 78 },
    { time: '12:00', score: 85 },
    { time: '16:00', score: 65 },
    { time: '20:00', score: 58 },
    { time: '24:00', score: 42 }
  ],
  vesselQueue: [
    { id: 'V-1001', name: 'MSC Isabella', type: 'Container', eta: '14:30', status: 'Approaching' },
    { id: 'V-1002', name: 'CMA CGM Antoine', type: 'Container', eta: '16:45', status: 'Waiting' },
    { id: 'V-1003', name: 'Ever Given', type: 'Container', eta: '18:00', status: 'Waiting' },
    { id: 'V-1004', name: 'Maersk Mc-Kinney', type: 'Container', eta: '20:15', status: 'Scheduled' },
  ],
  recommendations: [
    { id: 1, type: 'Critical', text: 'Reassign Crane 4 to Berth 2 to reduce expected delay for MSC Isabella.' },
    { id: 2, type: 'Warning', text: 'Berth 3 maintenance window approaching in 12 hours.' }
  ]
};
