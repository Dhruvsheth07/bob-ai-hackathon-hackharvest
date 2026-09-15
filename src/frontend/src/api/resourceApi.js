import { berthMock, craneMock } from '../mocks/resourceMock';

// ── LocalStorage-backed CRUD for Berths & Cranes ─────────────────────────────
// Falls back to mock data on first run; persists changes across page reloads.

const BERTH_KEY = 'port_berths';
const CRANE_KEY = 'port_cranes';

function readStore(key, seed) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Seed with mock data on first use
  const seeded = seed.map((item, i) => ({ ...item, _localId: item.id || `local-${i}` }));
  localStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
}

function writeStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function nextId(items) {
  const nums = items.map((x) => parseInt(String(x.id).replace(/\D/g, ''), 10)).filter(Boolean);
  return nums.length ? Math.max(...nums) + 1 : 1;
}

// Simulate async network delay
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const resourceApi = {
  // ── BERTHS ────────────────────────────────────────────────────────────────
  getBerths: async () => {
    await delay();
    return readStore(BERTH_KEY, berthMock);
  },

  createBerth: async (payload) => {
    await delay();
    const berths = readStore(BERTH_KEY, berthMock);
    const id = `B${nextId(berths)}`;
    const newBerth = {
      id,
      name:           payload.name,
      type:           payload.type           || 'Standard',
      status:         payload.status         || 'Available',
      currentVessel:  payload.currentVessel  || null,
      utilization:    payload.utilization    ?? 0,
      nextAvailable:  payload.nextAvailable  || 'Now',
      depth_m:        payload.depth_m        ?? null,
      length_m:       payload.length_m       ?? null,
      notes:          payload.notes          || '',
    };
    berths.push(newBerth);
    writeStore(BERTH_KEY, berths);
    return newBerth;
  },

  updateBerth: async (id, payload) => {
    await delay();
    const berths = readStore(BERTH_KEY, berthMock);
    const idx = berths.findIndex((b) => String(b.id) === String(id));
    if (idx === -1) throw new Error('Berth not found');
    berths[idx] = { ...berths[idx], ...payload };
    writeStore(BERTH_KEY, berths);
    return berths[idx];
  },

  deleteBerth: async (id) => {
    await delay();
    const berths = readStore(BERTH_KEY, berthMock);
    const filtered = berths.filter((b) => String(b.id) !== String(id));
    writeStore(BERTH_KEY, filtered);
  },

  // ── CRANES ────────────────────────────────────────────────────────────────
  getCranes: async () => {
    await delay();
    return readStore(CRANE_KEY, craneMock);
  },

  createCrane: async (payload) => {
    await delay();
    const cranes = readStore(CRANE_KEY, craneMock);
    const id = `C${nextId(cranes)}`;
    const newCrane = {
      id,
      name:            payload.name,
      type:            payload.type            || 'STS',
      status:          payload.status          || 'Available',
      assignedBerth:   payload.assignedBerth   || null,
      efficiency:      payload.efficiency      ?? 100,
      lastMaintenance: payload.lastMaintenance || new Date().toISOString().split('T')[0],
      capacity_th:     payload.capacity_th     ?? null,
      notes:           payload.notes           || '',
    };
    cranes.push(newCrane);
    writeStore(CRANE_KEY, cranes);
    return newCrane;
  },

  updateCrane: async (id, payload) => {
    await delay();
    const cranes = readStore(CRANE_KEY, craneMock);
    const idx = cranes.findIndex((c) => String(c.id) === String(id));
    if (idx === -1) throw new Error('Crane not found');
    cranes[idx] = { ...cranes[idx], ...payload };
    writeStore(CRANE_KEY, cranes);
    return cranes[idx];
  },

  deleteCrane: async (id) => {
    await delay();
    const cranes = readStore(CRANE_KEY, craneMock);
    const filtered = cranes.filter((c) => String(c.id) !== String(id));
    writeStore(CRANE_KEY, filtered);
  },
};
