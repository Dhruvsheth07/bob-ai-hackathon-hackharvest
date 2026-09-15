export const scheduleMock = {
  berths: [
    { id: 'B1', name: 'Berth 1', capacity: '18000 TEU' },
    { id: 'B2', name: 'Berth 2', capacity: '14000 TEU' },
    { id: 'B3', name: 'Berth 3', capacity: '10000 TEU' },
    { id: 'B4', name: 'Berth 4', capacity: '8000 TEU' },
  ],
  assignments: [
    { id: 1, vesselId: 'V-1001', vesselName: 'MSC Isabella', berthId: 'B1', startTime: '2026-09-14T15:00:00Z', endTime: '2026-09-15T08:00:00Z', status: 'Confirmed' },
    { id: 2, vesselId: 'V-1002', vesselName: 'CMA CGM Antoine', berthId: 'B2', startTime: '2026-09-14T18:00:00Z', endTime: '2026-09-15T12:00:00Z', status: 'Tentative' },
    { id: 3, vesselId: 'V-1003', vesselName: 'Ever Given', berthId: 'B1', startTime: '2026-09-15T10:00:00Z', endTime: '2026-09-16T14:00:00Z', status: 'Scheduled' },
  ]
};
