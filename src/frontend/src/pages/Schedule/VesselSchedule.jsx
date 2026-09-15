import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar as CalendarIcon, Filter, ChevronLeft, ChevronRight,
  Clock, Ship, Plus, X, RefreshCw,
} from 'lucide-react';
import { scheduleApi } from '../../api/scheduleApi';
import { vesselApi } from '../../api/vesselApi';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';

// ── Status colour map ─────────────────────────────────────────────────────────
const STATUS_VARIANT = {
  SCHEDULED: 'outline',
  ARRIVED: 'default',
  BERTHED: 'success',
  IN_PROGRESS: 'warning',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
};

const PRIORITY_VARIANT = {
  NORMAL: 'outline',
  HIGH: 'warning',
  CRITICAL: 'destructive',
};

// ── Add Schedule Modal ────────────────────────────────────────────────────────
function AddScheduleModal({ vessels, onClose, onSuccess }) {
  const [form, setForm] = useState({
    vessel_id: '',
    port_id: '1',          // default port — adjust as needed
    eta: '',
    etd: '',
    containers_teu: '',
    priority: 'NORMAL',
    status: 'SCHEDULED',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        vessel_id: parseInt(form.vessel_id, 10),
        port_id: parseInt(form.port_id, 10),
        eta: new Date(form.eta).toISOString(),
        etd: form.etd ? new Date(form.etd).toISOString() : undefined,
        containers_teu: form.containers_teu ? parseInt(form.containers_teu, 10) : 0,
        priority: form.priority,
        status: form.status,
      };
      await scheduleApi.createSchedule(payload);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create schedule entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-outline-variant rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">Schedule Vessel Arrival</h2>
              <p className="text-xs text-on-surface-variant">Add a new vessel schedule entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-error/10 border border-error/30 text-error text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                Vessel <span className="text-error">*</span>
              </label>
              <select
                name="vessel_id"
                value={form.vessel_id}
                onChange={handleChange}
                required
                className="w-full h-9 px-3 py-1 text-sm rounded-md border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a vessel...</option>
                {vessels.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.imo_number ? `(${v.imo_number})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                Port ID <span className="text-error">*</span>
              </label>
              <Input
                name="port_id"
                type="number"
                value={form.port_id}
                onChange={handleChange}
                placeholder="Port ID"
                required
                min="1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                ETA <span className="text-error">*</span>
              </label>
              <Input name="eta" type="datetime-local" value={form.eta} onChange={handleChange} required />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                ETD
              </label>
              <Input name="etd" type="datetime-local" value={form.etd} onChange={handleChange} />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                Containers (TEU)
              </label>
              <Input
                name="containers_teu"
                type="number"
                value={form.containers_teu}
                onChange={handleChange}
                placeholder="e.g. 2000"
                min="0"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full h-9 px-3 py-1 text-sm rounded-md border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Scheduling...' : 'Add Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Schedule Row Card ─────────────────────────────────────────────────────────
function ScheduleCard({ entry }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-outline-variant rounded-lg bg-surface hover:bg-surface-container-low transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Ship className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-on-surface truncate">
            {entry.vessel_name || `Vessel #${entry.vessel_id}`}
          </p>
          <p className="text-xs text-on-surface-variant">
            Port {entry.port_id}{entry.port_name ? ` — ${entry.port_name}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
        <div className="flex items-center gap-1 text-on-surface-variant">
          <Clock className="w-3.5 h-3.5" />
          <span>
            ETA: <span className="font-mono text-on-surface">{new Date(entry.eta).toLocaleString()}</span>
          </span>
        </div>
        {entry.etd && (
          <div className="flex items-center gap-1 text-on-surface-variant">
            <Clock className="w-3.5 h-3.5" />
            <span>
              ETD: <span className="font-mono text-on-surface">{new Date(entry.etd).toLocaleString()}</span>
            </span>
          </div>
        )}
        {entry.containers_teu != null && (
          <span className="text-on-surface-variant">{entry.containers_teu.toLocaleString()} TEU</span>
        )}
        <Badge variant={PRIORITY_VARIANT[entry.priority] ?? 'outline'}>{entry.priority}</Badge>
        <Badge variant={STATUS_VARIANT[entry.status] ?? 'outline'}>{entry.status}</Badge>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function VesselSchedule() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [vessels, setVessels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [schedRes, vesselRes] = await Promise.all([
        scheduleApi.getSchedules({ page: 1, page_size: 100, sort_by: 'eta' }),
        vesselApi.getVessels({ page: 1, page_size: 200 }),
      ]);
      const schedules = Array.isArray(schedRes) ? schedRes : schedRes?.items ?? [];
      const vesselList = Array.isArray(vesselRes) ? vesselRes : vesselRes?.items ?? [];
      setItems(schedules);
      setTotal(schedRes?.total ?? schedules.length);
      setVessels(vesselList);
    } catch (err) {
      console.error('Failed to load schedule data', err);
      setError(err.message || 'Failed to load schedule data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statuses = ['ALL', 'SCHEDULED', 'ARRIVED', 'BERTHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const filtered = statusFilter === 'ALL' ? items : items.filter((s) => s.status === statusFilter);

  return (
    <div className="space-y-6">
      {showAddModal && (
        <AddScheduleModal
          vessels={vessels}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); loadData(); }}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Vessel Schedule</h1>
          <p className="text-sm text-on-surface-variant">
            {total} schedule entr{total !== 1 ? 'ies' : 'y'} — sorted by ETA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadData} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Vessel
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={loadData} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              statusFilter === s
                ? 'bg-primary text-on-primary border-primary'
                : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
            }`}
          >
            {s === 'ALL' ? `All (${total})` : s}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-on-surface-variant">Loading schedule...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3 text-center">
              <CalendarIcon className="w-10 h-10 text-on-surface-variant/40" />
              <p className="text-on-surface-variant text-sm">No schedule entries found.</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule First Vessel
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((entry) => (
                <ScheduleCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
