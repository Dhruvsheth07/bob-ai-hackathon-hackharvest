import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Ship, Calendar, AlertTriangle,
  CheckCircle, Clock, BarChart3, RefreshCw, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { vesselApi } from '../../api/vesselApi';
import { scheduleApi } from '../../api/scheduleApi';
import { intelligenceApi } from '../../api/intelligenceApi';

// ── Palette ───────────────────────────────────────────────────────────────────
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const STATUS_COLOR = {
  SCHEDULED:   '#3b82f6',
  ARRIVED:     '#06b6d4',
  BERTHED:     '#10b981',
  IN_PROGRESS: '#f59e0b',
  COMPLETED:   '#22c55e',
  CANCELLED:   '#ef4444',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function KPICard({ title, value, sub, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-on-surface-variant">{title}</p>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <p className="text-3xl font-bold font-mono text-on-surface">{value}</p>
        {sub && <p className="text-xs text-on-surface-variant mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-high p-3 text-xs shadow-lg">
      <p className="font-mono text-on-surface mb-1.5">{label}</p>
      {payload.map((e) => (
        <p key={e.dataKey} style={{ color: e.color }}>
          {e.name}: <span className="font-bold">{e.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export function Reports() {
  const [vessels, setVessels]       = useState([]);
  const [schedules, setSchedules]   = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [vRes, sRes, pRes] = await Promise.all([
        vesselApi.getVessels({ page: 1, page_size: 100 }),
        scheduleApi.getSchedules({ page: 1, page_size: 100, sort_by: 'eta' }),
        intelligenceApi.getPredictions({ page: 1, page_size: 100 }),
      ]);
      setVessels(Array.isArray(vRes) ? vRes : vRes?.items ?? []);
      setSchedules(Array.isArray(sRes) ? sRes : sRes?.items ?? []);
      setPredictions(Array.isArray(pRes) ? pRes : pRes?.items ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived metrics ────────────────────────────────────────────────────────
  const totalVessels    = vessels.length;
  const totalSchedules  = schedules.length;
  const completedTrips  = schedules.filter((s) => s.status === 'COMPLETED').length;
  const cancelledTrips  = schedules.filter((s) => s.status === 'CANCELLED').length;
  const onTimeRate      = totalSchedules > 0
    ? Math.round(((totalSchedules - cancelledTrips) / totalSchedules) * 100)
    : 0;

  // Schedule status breakdown for pie chart
  const statusCounts = Object.entries(
    schedules.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Vessel type breakdown for bar chart
  const vesselTypes = Object.entries(
    vessels.reduce((acc, v) => {
      const t = v.vessel_type || 'UNKNOWN';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count }));

  // Capacity distribution
  const totalTEU = vessels.reduce((s, v) => s + (v.capacity_teu || 0), 0);
  const avgTEU   = totalVessels > 0 ? Math.round(totalTEU / totalVessels) : 0;

  // TEU load per schedule
  const teuData = schedules
    .filter((s) => s.containers_teu != null)
    .slice(0, 10)
    .map((s) => ({
      name: (s.vessel_name || `V#${s.vessel_id}`).split(' ').slice(0, 2).join(' '),
      teu:  s.containers_teu,
      priority: s.priority,
    }));

  // Congestion trend (last 24 predictions)
  const congestionTrend = predictions.slice(0, 24).map((p) => ({
    time:  new Date(p.prediction_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: Math.round((p.congestion_score ?? 0) * 100),
    risk:  p.risk_level,
  })).reverse();

  const avgCongestion = predictions.length > 0
    ? Math.round(predictions.reduce((s, p) => s + (p.congestion_score ?? 0), 0) / predictions.length * 100)
    : 0;

  const highRiskHours = predictions.filter(
    (p) => (p.risk_level === 'HIGH' || p.risk_level === 'CRITICAL')
  ).length;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-on-surface-variant">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Analytics & Reports</h1>
          <p className="text-sm text-on-surface-variant">
            Port performance overview — vessels, schedules, and congestion insights.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />{error}
          <button onClick={load} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Registered Vessels"  value={totalVessels}   sub={`${totalTEU.toLocaleString()} total TEU capacity`} icon={Ship}          color="#3b82f6" />
        <KPICard title="Total Schedules"     value={totalSchedules} sub={`${completedTrips} completed, ${cancelledTrips} cancelled`}          icon={Calendar}      color="#10b981" />
        <KPICard title="On-Time Rate"        value={`${onTimeRate}%`} sub="Schedules not cancelled"                        icon={CheckCircle}   color="#22c55e" />
        <KPICard title="Avg Congestion Score" value={`${avgCongestion}/100`} sub={`${highRiskHours} high-risk hours in forecast`} icon={AlertTriangle} color="#f59e0b" />
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Schedule Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Status Breakdown</CardTitle>
            <CardDescription>Distribution across all schedule entries</CardDescription>
          </CardHeader>
          <CardContent>
            {statusCounts.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-on-surface-variant">No schedule data</div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {statusCounts.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLOR[entry.name] ?? '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ backgroundColor: 'var(--surface-container-high)', borderColor: 'var(--outline-variant)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vessel Types Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet by Vessel Type</CardTitle>
            <CardDescription>Count of registered vessels per type</CardDescription>
          </CardHeader>
          <CardContent>
            {vesselTypes.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-on-surface-variant">No vessel data</div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vesselTypes} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'var(--on-surface-variant)' }} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'var(--on-surface-variant)' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Vessels" radius={[4, 4, 0, 0]}>
                      {vesselTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TEU Load per Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Container Load per Vessel</CardTitle>
            <CardDescription>TEU carried per scheduled visit</CardDescription>
          </CardHeader>
          <CardContent>
            {teuData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-on-surface-variant">No TEU data</div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teuData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'var(--on-surface-variant)' }} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'var(--on-surface-variant)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="teu" name="TEU" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Congestion Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Congestion Score Trend</CardTitle>
            <CardDescription>Last 24 forecast slots — score 0–100</CardDescription>
          </CardHeader>
          <CardContent>
            {congestionTrend.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center gap-2 text-sm text-on-surface-variant">
                <BarChart3 className="w-8 h-8 opacity-30" />
                No congestion data — generate a forecast first.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={congestionTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCong" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
                    <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'var(--on-surface-variant)' }} interval={Math.floor(congestionTrend.length / 6)} />
                    <YAxis domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'var(--on-surface-variant)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="score" name="Congestion" stroke="#f59e0b" strokeWidth={2} fill="url(#gradCong)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fleet Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet Summary</CardTitle>
            <CardDescription>Key vessel metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Total Fleet Size',    value: `${totalVessels} vessels`,          icon: Ship },
                { label: 'Total TEU Capacity',  value: totalTEU.toLocaleString() + ' TEU', icon: BarChart3 },
                { label: 'Avg TEU per Vessel',  value: avgTEU.toLocaleString() + ' TEU',   icon: TrendingUp },
                { label: 'Active Schedules',    value: `${totalSchedules - completedTrips - cancelledTrips} active`, icon: Clock },
                { label: 'Completed Trips',     value: `${completedTrips} trips`,           icon: CheckCircle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-outline-variant/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-on-surface-variant" />
                    <span className="text-sm text-on-surface-variant">{label}</span>
                  </div>
                  <span className="text-sm font-semibold font-mono text-on-surface">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Vessel Detail Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Roster</CardTitle>
          <CardDescription>All registered vessels with capacity details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-md border border-outline-variant">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  {['Vessel', 'IMO', 'Type', 'Length', 'Draft', 'Capacity (TEU)', 'Registered'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-outline-variant/50">
                {vessels.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">No vessels registered</td></tr>
                ) : vessels.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-medium text-on-surface flex items-center gap-2">
                      <Ship className="w-4 h-4 text-primary shrink-0" />{v.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{v.imo_number || '—'}</td>
                    <td className="px-4 py-3">
                      {v.vessel_type ? <Badge variant="secondary">{v.vessel_type}</Badge> : <span className="text-on-surface-variant">—</span>}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{v.length_m != null ? `${v.length_m} m` : '—'}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{v.draft_m  != null ? `${v.draft_m} m`  : '—'}</td>
                    <td className="px-4 py-3 font-mono text-on-surface">{v.capacity_teu != null ? v.capacity_teu.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
