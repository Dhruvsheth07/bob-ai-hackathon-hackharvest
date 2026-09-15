export const intelligenceMock = {
  congestionPrediction: {
    currentScore: 65,
    riskLevel: 'Moderate',
    predictedPeak: '2026-09-15T14:00:00Z',
    confidence: '89%',
    modelVersion: 'v4.2.1-prod',
    factors: [
      { name: 'Weather Delay', impact: '+15%' },
      { name: 'Crane Maintenance', impact: '+10%' },
      { name: 'High Arrival Volume', impact: '+25%' }
    ],
    forecast24h: [
      { time: '+4h', score: 68 },
      { time: '+8h', score: 72 },
      { time: '+12h', score: 78 },
      { time: '+16h', score: 85 },
      { time: '+20h', score: 70 },
      { time: '+24h', score: 60 },
    ]
  },
  recommendations: [
    { id: 1, severity: 'Critical', type: 'Berth Reallocation', title: 'Reassign MSC Isabella to Berth 3', explanation: 'Crane maintenance on Berth 1 will cause a 4-hour delay. Moving to Berth 3 prevents downstream congestion.', affectedResource: 'Berth 1', expectedImpact: '-12% Congestion', confidence: '94%', timestamp: '10 mins ago', status: 'Pending' },
    { id: 2, severity: 'Warning', type: 'Speed Optimization', title: 'Request speed reduction for Ever Given', explanation: 'Arriving early will result in 6 hours of idle anchorage waiting time.', affectedResource: 'V-1003', expectedImpact: '-$4,500 Fuel Cost', confidence: '88%', timestamp: '1 hour ago', status: 'Pending' },
    { id: 3, severity: 'Info', type: 'Maintenance Reschedule', title: 'Delay Gantry Crane 4 maintenance', explanation: 'Current queue volume is exceptionally high. Delaying maintenance by 24h ensures smooth processing.', affectedResource: 'Crane 4', expectedImpact: 'Maintain 95% throughput', confidence: '75%', timestamp: '2 hours ago', status: 'Accepted' },
  ]
};
