import React, { useEffect, useState, useCallback } from 'react';
import { Anchor, Clock, Plus, Pencil, Trash2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { resourceApi } from '../../api/resourceApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Input } from '../../components/common/Input';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_VARIANT = {
  Occupied:    'success',
  Available:   'default',
  Maintenance: 'destructive',
  Reserved:    'warning',
};

const BERTH_TYPES   = ['Deep Water', 'Standard', 'Shallow Water', 'Ro-Ro', 'Tanker', 'Bulk'];
const BERTH_STATUSES = ['Available', 'Occupied', 'Maintenance', 'Reserved'];

// ── Berth Modal ───────────────────────────────────────────────────────────────
function BerthModal({ initial, onClose, onSuccess }) {
  const isEditing = !!initial;
  const [form, setForm] = useState({
    name:          initial?.name          ?? '',
    type:          initial?.type          ?? 'Standard',
    status:        initial?.status        ?? 'Available',
    currentVessel: initial?.currentVessel ?? '',
    depth_m:       initial?.depth_m       ?? '',
    length_m:      initial?.length_m      ?? '',
    utilization:   initial?.utilization   ?? 0,
    nextAvailable: initial?.nextAvailable ?? 'Now',
    notes:         initial?.notes         ?? '',
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
        depth_m:     form.depth_m     ? parseFloat(form.depth_m)     : null,
        length_m:    form.length_m    ? parseFloat(form.length_m)     : null,
        utilization: form.utilization ? parseInt(form.utilization, 10) : 0,
        currentVessel: form.status === 'Occupied' ? (form.currentVessel || null) : null,
      };
      if (isEditing) await resourceApi.updateBerth(initial.id, payload);
      else           await resourceApi.createBerth(payload);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save berth');
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
              {isEditing ? <Pencil className="w-5 h-5 text-primary" /> : <Anchor className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">{isEditing ? 'Edit Berth' : 'Add New Berth'}</h2>
              <p className="text-xs text-on-surface-variant">{isEditing ? `Editing: ${initial.name}` : 'Register a new port berth'}</p>
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
                Berth Name <span className="text-error">*</span>
              </label>
              <Input name="name" value={form.name} onChange={set} placeholder="e.g. Berth 5" required />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Type</label>
              <select name="type" value={form.type} onChange={set}
                className="w-full h-9 px-3 text-sm rounded-md border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
                {BERTH_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Status</label>
              <select name="status" value={form.status} onChange={set}
                className="w-full h-9 px-3 text-sm rounded-md border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
                {BERTH_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            {form.status === 'Occupied' && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Current Vessel</label>
                <Input name="currentVessel" value={form.currentVessel} onChange={set} placeholder="Vessel name" />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Depth (m)</label>
              <Input name="depth_m" type="number" value={form.depth_m} onChange={set} placeholder="e.g. 18" min="1" step="0.1" />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Length (m)</label>
              <Input name="length_m" type="number" value={form.length_m} onChange={set} placeholder="e.g. 400" min="1" step="1" />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Utilization % (30d)</label>
              <Input name="utilization" type="number" value={form.utilization} onChange={set} min="0" max="100" />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">Next Available</label>
              <Input name="nextAvailable" value={form.nextAvailable} onChange={set} placeholder="Now or datetime" />
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
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Berth'}
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

// ── Berth Card ────────────────────────────────────────────────────────────────
function BerthCard({ berth, onEdit, onDelete }) {
  return (
    <Card className="flex flex-col group/card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <CardTitle className="text-lg truncate">{berth.name}</CardTitle>
            <CardDescription>{berth.type}</CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(berth)}
              className="p-1.5 rounded-md text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors opacity-0 group-hover/card:opacity-100">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(berth)}
              className="p-1.5 rounded-md text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors opacity-0 group-hover/card:opacity-100">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <Anchor className={`w-5 h-5 ml-1 ${berth.status === 'Occupied' ? 'text-primary' : 'text-on-surface-variant'}`} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {/* Status */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-on-surface-variant">Status</span>
          <Badge variant={STATUS_VARIANT[berth.status] ?? 'outline'}>{berth.status}</Badge>
        </div>

        {/* Specs */}
        {(berth.depth_m || berth.length_m) && (
          <div className="flex gap-3 text-xs text-on-surface-variant">
            {berth.depth_m  && <span>Depth: <span className="font-mono text-on-surface">{berth.depth_m}m</span></span>}
            {berth.length_m && <span>Length: <span className="font-mono text-on-surface">{berth.length_m}m</span></span>}
          </div>
        )}

        {/* Current vessel or empty */}
        {berth.status === 'Occupied' ? (
          <div className="bg-surface-container-high p-3 rounded-md border border-outline-variant">
            <span className="text-xs text-on-surface-variant block mb-0.5">Current Vessel</span>
            <span className="text-sm font-semibold text-on-surface">{berth.currentVessel || '—'}</span>
          </div>
        ) : (
          <div className="bg-surface-container p-3 rounded-md border border-outline-variant flex items-center justify-center h-[58px]">
            <span className="text-sm text-on-surface-variant">No vessel moored</span>
          </div>
        )}

        {/* Utilization bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-on-surface-variant">Utilization (30d)</span>
            <span className="text-xs font-mono font-medium">{berth.utilization ?? 0}%</span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${(berth.utilization ?? 0) > 80 ? 'bg-primary' : 'bg-secondary'}`}
              style={{ width: `${Math.min(berth.utilization ?? 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Next available */}
        <div className="mt-auto pt-3 border-t border-outline-variant flex items-center gap-2 text-xs text-on-surface-variant">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Next Available: <span className="font-mono">{
            berth.nextAvailable === 'Now' ? 'Now' : new Date(berth.nextAvailable).toLocaleString()
          }</span></span>
        </div>

        {berth.notes && (
          <p className="text-xs text-on-surface-variant italic border-t border-outline-variant pt-2">{berth.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function BerthMonitoring() {
  const [data, setData]             = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [addOpen, setAddOpen]       = useState(false);
  const [editBerth, setEditBerth]   = useState(null);
  const [deleteBerth, setDeleteBerth] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try { setData(await resourceApi.getBerths()); }
    catch (err) { setError(err.message || 'Failed to load berths'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSuccess = () => { setAddOpen(false); setEditBerth(null); setDeleteBerth(null); load(); };

  const occupied    = data.filter((b) => b.status === 'Occupied').length;
  const maintenance = data.filter((b) => b.status === 'Maintenance').length;

  return (
    <div className="space-y-6">
      {/* Modals */}
      {addOpen    && <BerthModal initial={null}      onClose={() => setAddOpen(false)}      onSuccess={handleSuccess} />}
      {editBerth  && <BerthModal initial={editBerth} onClose={() => setEditBerth(null)}     onSuccess={handleSuccess} />}
      {deleteBerth && (
        <DeleteModal
          label={deleteBerth.name}
          onClose={() => setDeleteBerth(null)}
          onConfirm={async () => { await resourceApi.deleteBerth(deleteBerth.id); handleSuccess(); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Berth Monitoring</h1>
          <p className="text-sm text-on-surface-variant">
            {data.length} berths — {occupied} occupied, {maintenance} in maintenance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Berth</Button>
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
          <p className="text-sm text-on-surface-variant">Loading berths...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center gap-3 text-center border border-outline-variant rounded-lg">
          <Anchor className="w-10 h-10 text-on-surface-variant/40" />
          <p className="text-sm text-on-surface-variant">No berths registered.</p>
          <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" />Add First Berth</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((berth) => (
            <BerthCard key={berth.id} berth={berth} onEdit={setEditBerth} onDelete={setDeleteBerth} />
          ))}
        </div>
      )}
    </div>
  );
}
