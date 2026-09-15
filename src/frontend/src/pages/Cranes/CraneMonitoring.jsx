import React, { useEffect, useState, useCallback } from 'react';
import { Tractor, Wrench, CheckCircle, Plus, Pencil, Trash2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { resourceApi } from '../../api/resourceApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Input } from '../../components/common/Input';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_VARIANT = {
  Working:     'success',
  Available:   'default',
  Maintenance: 'destructive',
  Standby:     'warning',
};

const CRANE_TYPES    = ['STS', 'RTG', 'RMG', 'Mobile', 'Overhead', 'Reach Stacker'];
const CRANE_STATUSES = ['Available', 'Working', 'Maintenance', 'Standby'];

// ── Crane Modal ───────────────────────────────────────────────────────────────
function CraneModal({ initial, berthNames, onClose, onSuccess }) {
  const isEditing = !!initial;
  const [form, setForm] = useState({
    name:            initial?.name            ?? '',
    type:            initial?.type            ?? 'STS',
    status:          initial?.status          ?? 'Available',
    assignedBerth:   initial?.assignedBerth   ?? '',
    efficiency:      initial?.efficiency      ?? 100,
    capacity_th:     initial?.capacity_th     ?? '',
    lastMaintenance: initial?.lastMaintenance ?? new Date().toISOString().split('T')[0],
    notes:           initial?.notes           ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        efficiency:  parseInt(form.efficiency, 10) || 0,
        capacity_th: form.capacity_th ? parseFloat(form.capacity_th) : null,
        assignedBerth: form.assignedBerth || null,
      };
      if (isEditing) await resourceApi.updateCrane(initial.id, payload);
      else           await resourceApi.createCrane(payload);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save crane');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-outline-variant rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              {isEditing ? <Pencil className="w-5 h-5 text-primary" /> : <Tractor className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">{isEditing ? 'Edit Crane' : 'Add New Crane'}</h2>
              <p className="text-xs text-on-surface-variant">{isEditing ? `Editing: ${initial.name}` : 'Register a new port crane'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-error/10 border border-error/30 text-error text-sm px-4 py-2 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                Crane Name <span className="text-error">*</span>
              </label>
              <Input name="name" value={form.name} onChange={set} placeholder="e.g. Gantry Crane 7" required />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Type</label>
              <select name="type" value={form.type} onChange={set}
                className="w-full h-9 px-3 text-sm rounded-md border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
                {CRANE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Status</label>
              <select name="status" value={form.status} onChange={set}
                className="w-full h-9 px-3 text-sm rounded-md border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
                {CRANE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Assigned Berth</label>
              <select name="assignedBerth" value={form.assignedBerth} onChange={set}
                className="w-full h-9 px-3 text-sm rounded-md border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Unassigned</option>
                {berthNames.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Efficiency %</label>
              <Input name="efficiency" type="number" value={form.efficiency} onChange={set} min="0" max="100" />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Capacity (t/h)</label>
              <Input name="capacity_th" type="number" value={form.capacity_th} onChange={set} placeholder="e.g. 40" min="0" step="0.1" />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Last Maintenance</label>
              <Input name="lastMaintenance" type="date" value={form.lastMaintenance} onChange={set} />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Notes</label>
              <textarea name="notes" value={form.notes} onChange={set} rows={2}
                placeholder="Optional notes..."
                className="w-full px-3 py-2 text-sm rounded-md border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Crane'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteModal({ label, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const handle = async () => {
    setLoading(true);
    try { await onConfirm(); }
    catch (err) { setError(err.message || 'Delete failed'); setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-outline-variant rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-error" />
          </div>
          <div>
            <h2 className="font-semibold text-on-surface">Confirm Delete</h2>
            <p className="text-sm text-on-surface-variant">This cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-on-surface mb-4">Delete <span className="font-semibold">{label}</span>?</p>
        {error && <div className="bg-error/10 border border-error/30 text-error text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-error text-on-error hover:bg-error/80" onClick={handle} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Crane Card ────────────────────────────────────────────────────────────────
function CraneCard({ crane, onEdit, onDelete }) {
  const statusIcon = crane.status === 'Working'
    ? 'bg-primary-container/20 text-primary'
    : crane.status === 'Maintenance'
    ? 'bg-error-container/30 text-error'
    : 'bg-surface-container-high text-on-surface-variant';

  return (
    <Card className="group/card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-md shrink-0 ${statusIcon}`}>
              <Tractor className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{crane.name}</CardTitle>
              <CardDescription className="text-xs font-mono">{crane.id} · {crane.type || 'STS'}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(crane)}
              className="p-1.5 rounded-md text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors opacity-0 group-hover/card:opacity-100">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(crane)}
              className="p-1.5 rounded-md text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors opacity-0 group-hover/card:opacity-100">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <Badge variant={STATUS_VARIANT[crane.status] ?? 'outline'} className="ml-1">{crane.status}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 grid grid-cols-2 gap-4 border-t border-outline-variant mt-2">
        <div>
          <span className="text-xs text-on-surface-variant block mb-1">Assigned Berth</span>
          <span className="text-sm font-semibold text-on-surface">{crane.assignedBerth || 'Unassigned'}</span>
        </div>
        <div>
          <span className="text-xs text-on-surface-variant block mb-1">Efficiency</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-mono font-medium text-on-surface">{crane.efficiency}%</span>
            {crane.efficiency > 90 && <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />}
          </div>
        </div>

        {crane.capacity_th && (
          <div>
            <span className="text-xs text-on-surface-variant block mb-1">Capacity</span>
            <span className="text-sm font-mono text-on-surface">{crane.capacity_th} t/h</span>
          </div>
        )}

        {/* Efficiency bar */}
        <div className={crane.capacity_th ? '' : 'col-span-2'}>
          <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-3">
            <div
              className={`h-1.5 rounded-full transition-all ${
                crane.efficiency > 80 ? 'bg-[#22c55e]' : crane.efficiency > 50 ? 'bg-[#f59e0b]' : 'bg-error'
              }`}
              style={{ width: `${Math.min(crane.efficiency, 100)}%` }}
            />
          </div>
        </div>

        <div className="col-span-2 flex items-center gap-2 text-xs text-on-surface-variant border-t border-outline-variant pt-3 mt-1">
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          <span>Last Maintenance: <span className="font-mono">{crane.lastMaintenance || '—'}</span></span>
        </div>

        {crane.notes && (
          <p className="col-span-2 text-xs text-on-surface-variant italic border-t border-outline-variant pt-2 -mt-1">{crane.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function CraneMonitoring() {
  const [data, setData]             = useState([]);
  const [berths, setBerths]         = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [addOpen, setAddOpen]       = useState(false);
  const [editCrane, setEditCrane]   = useState(null);
  const [deleteCrane, setDeleteCrane] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const [cranes, berthList] = await Promise.all([
        resourceApi.getCranes(),
        resourceApi.getBerths(),
      ]);
      setData(cranes);
      setBerths(berthList.map((b) => b.name));
    } catch (err) {
      setError(err.message || 'Failed to load cranes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSuccess = () => { setAddOpen(false); setEditCrane(null); setDeleteCrane(null); load(); };

  const working     = data.filter((c) => c.status === 'Working').length;
  const maintenance = data.filter((c) => c.status === 'Maintenance').length;

  return (
    <div className="space-y-6">
      {/* Modals */}
      {addOpen   && <CraneModal initial={null}      berthNames={berths} onClose={() => setAddOpen(false)}    onSuccess={handleSuccess} />}
      {editCrane && <CraneModal initial={editCrane} berthNames={berths} onClose={() => setEditCrane(null)}   onSuccess={handleSuccess} />}
      {deleteCrane && (
        <DeleteModal
          label={deleteCrane.name}
          onClose={() => setDeleteCrane(null)}
          onConfirm={async () => { await resourceApi.deleteCrane(deleteCrane.id); handleSuccess(); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Crane Monitoring</h1>
          <p className="text-sm text-on-surface-variant">
            {data.length} cranes — {working} working, {maintenance} in maintenance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Crane</Button>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />{error}
          <button onClick={load} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-on-surface-variant">Loading cranes...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center gap-3 text-center border border-outline-variant rounded-lg">
          <Tractor className="w-10 h-10 text-on-surface-variant/40" />
          <p className="text-sm text-on-surface-variant">No cranes registered.</p>
          <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" />Add First Crane</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((crane) => (
            <CraneCard key={crane.id} crane={crane} onEdit={setEditCrane} onDelete={setDeleteCrane} />
          ))}
        </div>
      )}
    </div>
  );
}
