import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, X, Ship, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { vesselApi } from '../../api/vesselApi';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { DataTable } from '../../components/common/DataTable';

// ── Shared label helper ───────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5 block">
      {children}{required && <span className="text-error ml-0.5">*</span>}
    </label>
  );
}

// ── Vessel Modal (Add + Edit) ─────────────────────────────────────────────────
function VesselModal({ initial, onClose, onSuccess }) {
  const isEditing = !!initial;

  const [form, setForm] = useState({
    name:         initial?.name         ?? '',
    imo_number:   initial?.imo_number   ?? '',
    vessel_type:  initial?.vessel_type  ?? '',
    length_m:     initial?.length_m     ?? '',
    draft_m:      initial?.draft_m      ?? '',
    capacity_teu: initial?.capacity_teu ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name:         form.name,
        imo_number:   form.imo_number   || undefined,
        vessel_type:  form.vessel_type  || undefined,
        length_m:     form.length_m     ? parseFloat(form.length_m)    : undefined,
        draft_m:      form.draft_m      ? parseFloat(form.draft_m)      : undefined,
        capacity_teu: form.capacity_teu ? parseInt(form.capacity_teu, 10) : undefined,
      };

      if (isEditing) {
        await vesselApi.updateVessel(initial.id, payload);
      } else {
        await vesselApi.createVessel(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || (isEditing ? 'Failed to update vessel' : 'Failed to create vessel'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-outline-variant rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              {isEditing ? <Pencil className="w-5 h-5 text-primary" /> : <Ship className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">
                {isEditing ? 'Edit Vessel' : 'Add New Vessel'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {isEditing ? `Editing: ${initial.name}` : 'Register a vessel in the system'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-error/10 border border-error/30 text-error text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <Label required>Vessel Name</Label>
              <Input name="name" value={form.name} onChange={handleChange}
                placeholder="e.g. MSC Aurora" required />
            </div>

            {/* IMO */}
            <div>
              <Label>IMO Number</Label>
              <Input name="imo_number" value={form.imo_number} onChange={handleChange}
                placeholder="e.g. IMO1234567" />
            </div>

            {/* Type */}
            <div>
              <Label>Vessel Type</Label>
              <select
                name="vessel_type"
                value={form.vessel_type}
                onChange={handleChange}
                className="w-full h-9 px-3 py-1 text-sm rounded-md border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select type...</option>
                <option value="CONTAINER">Container</option>
                <option value="BULK">Bulk Carrier</option>
                <option value="TANKER">Tanker</option>
                <option value="RORO">RoRo</option>
                <option value="GENERAL">General Cargo</option>
                <option value="LNG">LNG</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Length */}
            <div>
              <Label>Length (m)</Label>
              <Input name="length_m" type="number" value={form.length_m} onChange={handleChange}
                placeholder="e.g. 300" min="1" step="0.1" />
            </div>

            {/* Draft */}
            <div>
              <Label>Draft (m)</Label>
              <Input name="draft_m" type="number" value={form.draft_m} onChange={handleChange}
                placeholder="e.g. 14.5" min="0.1" step="0.1" />
            </div>

            {/* Capacity */}
            <div className="col-span-2">
              <Label>Capacity (TEU)</Label>
              <Input name="capacity_teu" type="number" value={form.capacity_teu} onChange={handleChange}
                placeholder="e.g. 15000" min="0" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading
                ? (isEditing ? 'Saving...'   : 'Creating...')
                : (isEditing ? 'Save Changes' : 'Create Vessel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteVesselModal({ vessel, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleDelete = async () => {
    setLoading(true);
    try {
      await vesselApi.deleteVessel(vessel.id);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to delete vessel');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-outline-variant rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-error" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-on-surface">Delete Vessel</h2>
              <p className="text-sm text-on-surface-variant">This action cannot be undone.</p>
            </div>
          </div>

          <p className="text-sm text-on-surface mb-1">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{vessel.name}</span>?
          </p>
          {vessel.imo_number && (
            <p className="text-xs text-on-surface-variant mb-4 font-mono">{vessel.imo_number}</p>
          )}

          {error && (
            <div className="bg-error/10 border border-error/30 text-error text-sm px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-error text-on-error hover:bg-error/80"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function VesselManagement() {
  const [items, setItems]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError]           = useState('');

  // Modal state
  const [addOpen, setAddOpen]         = useState(false);
  const [editVessel, setEditVessel]   = useState(null);
  const [deleteVessel, setDeleteVessel] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await vesselApi.getVessels({ page: 1, page_size: 100 });
      const vessels  = Array.isArray(response) ? response : response?.items ?? [];
      setItems(vessels);
      setTotal(response?.total ?? vessels.length);
    } catch (err) {
      console.error('Failed to load vessels', err);
      setError(err.message || 'Failed to load vessels');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredData = items.filter((vessel) => {
    const term = searchTerm.toLowerCase();
    return (
      vessel.name?.toLowerCase().includes(term) ||
      String(vessel.id).includes(term) ||
      vessel.imo_number?.toLowerCase().includes(term) ||
      vessel.vessel_type?.toLowerCase().includes(term)
    );
  });

  const handleModalSuccess = () => {
    setAddOpen(false);
    setEditVessel(null);
    setDeleteVessel(null);
    loadData();
  };

  const columns = [
    {
      header: 'ID',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono text-xs text-on-surface-variant">#{row.id}</span>,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-on-surface">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'IMO',
      accessorKey: 'imo_number',
      cell: (row) => (
        <span className="font-mono text-xs text-on-surface-variant">{row.imo_number || '—'}</span>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'vessel_type',
      cell: (row) => (
        row.vessel_type
          ? <Badge variant="secondary">{row.vessel_type}</Badge>
          : <span className="text-xs text-on-surface-variant">—</span>
      ),
    },
    {
      header: 'Length (m)',
      accessorKey: 'length_m',
      cell: (row) => (
        <span className="text-sm text-on-surface-variant">
          {row.length_m != null ? `${row.length_m} m` : '—'}
        </span>
      ),
    },
    {
      header: 'Capacity (TEU)',
      accessorKey: 'capacity_teu',
      cell: (row) => (
        <span className="text-sm text-on-surface-variant">
          {row.capacity_teu != null ? row.capacity_teu.toLocaleString() : '—'}
        </span>
      ),
    },
    {
      header: 'Registered',
      accessorKey: 'created_at',
      cell: (row) => (
        <span className="text-xs text-on-surface-variant">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: '',
      accessorKey: '__actions',
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setEditVessel(row); }}
            className="p-1.5 rounded-md text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
            title="Edit vessel"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteVessel(row); }}
            className="p-1.5 rounded-md text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
            title="Delete vessel"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Modals ── */}
      {addOpen && (
        <VesselModal initial={null} onClose={() => setAddOpen(false)} onSuccess={handleModalSuccess} />
      )}
      {editVessel && (
        <VesselModal initial={editVessel} onClose={() => setEditVessel(null)} onSuccess={handleModalSuccess} />
      )}
      {deleteVessel && (
        <DeleteVesselModal vessel={deleteVessel} onClose={() => setDeleteVessel(null)} onSuccess={handleModalSuccess} />
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Vessel Management</h1>
          <p className="text-sm text-on-surface-variant">
            {total} vessel{total !== 1 ? 's' : ''} registered in the system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadData} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vessel
          </Button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={loadData} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* ── Table Card ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <Input
              placeholder="Search by name, IMO, type..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 border border-outline-variant rounded-md">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-on-surface-variant">Loading vessels...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3 text-center border border-outline-variant rounded-md">
              <Ship className="w-10 h-10 text-on-surface-variant/40" />
              <p className="text-sm text-on-surface-variant">
                {searchTerm ? 'No vessels match your search.' : 'No vessels registered yet.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />Add First Vessel
                </Button>
              )}
            </div>
          ) : (
            <DataTable columns={columns} data={filteredData} rowClassName="group/row" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
