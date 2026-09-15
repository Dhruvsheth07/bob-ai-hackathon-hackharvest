import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Activity, ShieldAlert, ShieldCheck, ShieldX,
  RefreshCw, Zap, Clock, BarChart3, X,
} from 'lucide-react';
import { intelligenceApi } from '../../api/intelligenceApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  LOW:      { variant: 'success',     icon: ShieldCheck,  color: 'var(--success, #22c55e)' },
  MEDIUM:   { variant: 'warning',     icon: ShieldAlert,  color: 'var(--warning, #f59e0b)' },
  HIGH:     { variant: 'destructive', icon: ShieldX,      color: 'var(--error, #ef4444)'   },
  CRITICAL: { variant: 'destructive', icon: ShieldX,      color: '#dc2626'                  },
};

const getRiskConfig = (level) => RISK_CONFIG[level?.toUpperCase()] ?? RISK_CONFIG.LOW;

/** Convert a ForecastResponse predictions array into chart-friendly data */
function buildChartData(predictions) {
  return predictions.map((p) => ({
    time: new Date(p.prediction_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: Math.round((p.congestion_score ?? 0) * 100),
    berth: Math.round((p.berth_utilization ?? 0) * 100),
    crane: Math.round((p.crane_utilization ?? 0) * 100),
    yard:  Math.round((p.yard_utilization  ?? 0) * 100),
    risk:  p.risk_level,
  }));
}

/** Derive summary stats from predictions array */
function buildSummary(predictions, portName) {
  if (!predictions.length) return null;

  const latest = predictions[0];
  const scores = predictions.map((p) => (p.congestion_score ?? 0) * 100);
  const maxScore = Math.max(...scores);
  const peakIdx  = scores.indexOf(maxScore);
  const peakTime = predictions[peakIdx]?.prediction_time;

  // Derive contributing factors from utilization averages
  const avg = (key) =>
    (predictions.reduce((s, p) => s + (p[key] ?? 0), 0) / predictions.length) * 100;

  const factors = [
    { name: 'Berth Utilization',  value: avg('berth_utilization'),  key: 'berth' },
    { name: 'Crane Utilization',  value: avg('crane_utilization'),  key: 'crane' },
    { name: 'Yard Utilization',   value: avg('yard_utilization'),   key: 'yard'  },
    { name: 'Arrival Pressure',   value: avg('arrival_pressure') * 100, key: 'pressure' },
  ]
    .sort((a, b) => b.value - a.value)
    .map((f) => ({
      ...f,
      label: f.value >= 70 ? 'High' : f.value >= 40 ? 'Medium' : 'Low',
      variant: f.value >= 70 ? 'destructive' : f.value >= 40 ? 'warning' : 'outline',
    }));

  return {
    portName:     portName ?? 'Port',
    currentScore: Math.round((latest.congestion_score ?? 0) * 100),
    riskLevel:    latest.risk_level ?? 'LOW',
    modelVersion: latest.model_version ?? 'N/A',
    predictedPeak: peakTime,
    peakScore:    Math.round(maxScore),
    factors,
  };
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, iconColor }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-on-surface-variant">{title}</CardTitle>
        {Icon && <Icon className="w-4 h-4" style={{ color: iconColor }} />}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono text-on-surface">{value}</div>
        {sub && <p className="text-xs text-on-surface-variant mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-high p-3 text-xs shadow-lg">
      <p className="font-mono text-on-surface mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value}%</span>
        </p>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function CongestionPrediction() {
  const [forecast, setForecast] = useState(null);   // raw ForecastResponse
  const [summary, setSummary] = useState(null);     // derived stats
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const loadForecast = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await intelligenceApi.getForecast(1, 72);
      setForecast(data);
      const preds = data.predictions ?? [];
      setChartData(buildChartData(preds));
      setSummary(buildSummary(preds, data.port_name));
    } catch (err) {
      console.error('Failed to load congestion forecast', err);
      setError(err.message || 'Failed to load congestion data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const data = await intelligenceApi.generateForecast(1, 72, 1);
      setForecast(data);
      const preds = data.predictions ?? [];
      setChartData(buildChartData(preds));
      setSummary(buildSummary(preds, data.port_name));
    } catch (err) {
      setError(err.message || 'Failed to generate forecast');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, [loadForecast]);

  // ── Loading ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-on-surface-variant">Loading congestion data...</p>
      </div>
    );
  }

  const riskCfg = getRiskConfig(summary?.riskLevel);
  const RiskIcon = riskCfg.icon;

  // ── No predictions yet ────────────────────────────────────────────
  if (!summary || chartData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Congestion Prediction</h1>
          <p className="text-sm text-on-surface-variant">AI-driven terminal congestion forecasting and risk analysis.</p>
        </div>
        {error && (
          <div className="bg-error/10 border border-error/30 text-error text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <X className="w-4 h-4 shrink-0" />{error}
          </div>
        )}
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <BarChart3 className="w-12 h-12 text-on-surface-variant/40" />
            <div>
              <p className="font-medium text-on-surface">No forecast data available</p>
              <p className="text-sm text-on-surface-variant mt-1">
                Generate a new 72-hour congestion forecast to see predictions.
              </p>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              <Zap className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Forecast'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main View ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Congestion Prediction</h1>
          <p className="text-sm text-on-surface-variant">
            AI-driven forecast for <span className="font-medium text-on-surface">{summary.portName}</span>
            {forecast?.generated_at && (
              <span> · Generated {new Date(forecast.generated_at).toLocaleString()}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {summary.modelVersion}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Current Score"
          value={`${summary.currentScore}/100`}
          sub="Higher = more congested"
          icon={Activity}
          iconColor={riskCfg.color}
        />
        <StatCard
          title="Risk Level"
          value={
            <span className="flex items-center gap-2">
              <RiskIcon className="w-7 h-7" style={{ color: riskCfg.color }} />
              {summary.riskLevel}
            </span>
          }
          sub={`Based on ${forecast?.predictions?.length ?? 0}-slot forecast`}
        />
        <StatCard
          title="Predicted Peak"
          value={`${summary.peakScore}/100`}
          sub={summary.predictedPeak
            ? `at ${new Date(summary.predictedPeak).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}`
            : 'N/A'}
          icon={Clock}
          iconColor={riskCfg.color}
        />
      </div>

      {/* Chart + Factors */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>72-Hour Congestion Forecast</CardTitle>
            <CardDescription>Congestion score (0–100) over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={riskCfg.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={riskCfg.color} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
                  <XAxis
                    dataKey="time"
                    stroke="var(--on-surface-variant)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.floor(chartData.length / 8)}
                  />
                  <YAxis
                    stroke="var(--on-surface-variant)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'HIGH', fill: '#ef4444', fontSize: 10 }} />
                  <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'MED', fill: '#f59e0b', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    name="Congestion Score"
                    stroke={riskCfg.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#gradScore)"
                    dot={false}
                    activeDot={{ r: 4, fill: riskCfg.color }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contributing Factors</CardTitle>
            <CardDescription>Average utilization over forecast window</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.factors.map((factor) => (
                <div
                  key={factor.key}
                  className="p-3 border border-outline-variant rounded-lg bg-surface-container"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-on-surface">{factor.name}</span>
                    <Badge variant={factor.variant}>{factor.label}</Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-surface-container-highest">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(factor.value, 100).toFixed(1)}%`,
                        backgroundColor:
                          factor.variant === 'destructive' ? '#ef4444' :
                          factor.variant === 'warning'     ? '#f59e0b' : '#22c55e',
                      }}
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 text-right font-mono">
                    {factor.value.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
