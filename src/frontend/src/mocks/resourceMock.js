export const berthMock = [
  { id: 'B1', name: 'Berth 1', status: 'Occupied', currentVessel: 'MSC Isabella', utilization: 85, nextAvailable: '2026-09-15T08:00:00Z', type: 'Deep Water' },
  { id: 'B2', name: 'Berth 2', status: 'Available', currentVessel: null, utilization: 65, nextAvailable: 'Now', type: 'Standard' },
  { id: 'B3', name: 'Berth 3', status: 'Occupied', currentVessel: 'Ever Given', utilization: 92, nextAvailable: '2026-09-16T14:00:00Z', type: 'Deep Water' },
  { id: 'B4', name: 'Berth 4', status: 'Maintenance', currentVessel: null, utilization: 0, nextAvailable: '2026-09-17T00:00:00Z', type: 'Standard' },
];

export const craneMock = [
  { id: 'C1', name: 'Gantry Crane 1', status: 'Working', assignedBerth: 'B1', efficiency: 94, lastMaintenance: '2026-08-10' },
  { id: 'C2', name: 'Gantry Crane 2', status: 'Working', assignedBerth: 'B1', efficiency: 88, lastMaintenance: '2026-08-15' },
  { id: 'C3', name: 'Gantry Crane 3', status: 'Available', assignedBerth: null, efficiency: 100, lastMaintenance: '2026-09-01' },
  { id: 'C4', name: 'Gantry Crane 4', status: 'Maintenance', assignedBerth: null, efficiency: 0, lastMaintenance: '2026-09-10' },
  { id: 'C5', name: 'Gantry Crane 5', status: 'Working', assignedBerth: 'B3', efficiency: 91, lastMaintenance: '2026-07-20' },
  { id: 'C6', name: 'Mobile Crane 1', status: 'Working', assignedBerth: 'B3', efficiency: 85, lastMaintenance: '2026-08-05' },
];
