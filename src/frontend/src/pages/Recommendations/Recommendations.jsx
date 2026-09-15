import React, { useEffect, useState, useCallback } from 'react';
import { Lightbulb, Check, X, AlertTriangle, Info, AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { intelligenceApi } from '../../api/intelligenceApi';
import { Card, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';

// ── Maps ──────────────────────────────────────────────────────────────────────
const SEVERITY_ICON = {
  HIGH:     AlertCircle,
  CRITICAL: AlertCircle,
  MEDIUM:   AlertTriangle,
  LOW:      Info,
};

const SEVERITY_STYLE = {
  HIGH:     'bg-error-container/30 text-error',
  CRITICAL: 'bg-error-container/50 text-error',
  MEDIUM:   'bg-[#422006]/60 text-[#facc15]',
  LOW:      'bg-primary-container/20 text-primary',
};

const SEVERITY_BADGE = {
  HIGH:     'destructive',
  CRITICAL: 'destructive',
  MEDIUM:   'warning',
  LOW:      'secondary',
};

const TYPE_LABEL = {
  BERTH_ALLOCATION: 'Berth Allocation',
  CRANE_SCHEDULING: 'Crane Scheduling',
  MAINTENANCE:      'Maintenance',
  YARD_CAPACITY:    'Yard Capacity',
  VESSEL_PRIORITY:  'Vessel Priority',
};

const STATUS_FILTER = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'];

// ── Main Component ────────────────────────────────────────────────────────────
export function Recommendations() {
  const [data, setData]               = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actioning, setActioning]     = useState(null); // id of item being actioned

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await intelligenceApi.getRecommendations();
      setData(response);
    } catch (err) {
      console.error('Failed to load recommendations', err);
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, action) => {
    setActioning(id);
    try {
      await intelligenceApi.actionRecommendation(id, action);
      // Update local state optimistically
      setData((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' } : r)
      );
    } catch (err) {
      console.error('Action failed', err);
      // Re-fetch on failure
      load();
    } finally {
      setActioning(null);
    }
  };

  const filtered = statusFilter === 'ALL'
    ? data
    : data.filter((r) => r.status === statusFilter);

  const pending  = data.filter((r) => r.status === 'PENDING').length;
  const accepted = data.filter((r) => r.status === 'ACCEPTED').length;

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-on-surface-variant">Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">AI Recommendations</h1>
          <p className="text-sm text-on-surface-variant">
            {pending} pending · {accepted} accepted · {data.length} total suggestions.
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />{error}
          <button onClick={load} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER.map((s) => {
          const count = s === 'ALL' ? data.length : data.filter((r) => r.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-on-primary border-primary'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center gap-3 border border-outline-variant rounded-xl">
          <Inbox className="w-10 h-10 text-on-surface-variant/40" />
          <p className="text-sm text-on-surface-variant">
            {statusFilter === 'ALL' ? 'No recommendations yet.' : `No ${statusFilter.toLowerCase()} recommendations.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((rec) => {
            const Icon = SEVERITY_ICON[rec.severity] || Lightbulb;
            const isPending = rec.status === 'PENDING';
            const isActioning = actioning === rec.id;

            return (
              <Card key={rec.id} className={!isPending ? 'opacity-70' : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">

                    {/* Icon + Content */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-full mt-0.5 shrink-0 ${SEVERITY_STYLE[rec.severity] ?? 'bg-primary/10 text-primary'}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant={SEVERITY_BADGE[rec.severity] ?? 'outline'} className="text-xs">
                            {rec.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {TYPE_LABEL[rec.type] || rec.type}
                          </Badge>
                          {rec.created_at && (
                            <span className="text-xs text-on-surface-variant">
                              {new Date(rec.created_at).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-semibold text-on-surface leading-snug">
                          {rec.title}
                        </h3>

                        {/* Description */}
                        {rec.description && (
                          <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed max-w-2xl">
                            {rec.description}
                          </p>
                        )}

                        {/* Impact */}
                        {rec.expected_impact && (
                          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#163b27] border border-[#4ade80]/20 text-xs text-[#4ade80] font-medium">
                            <Check className="w-3 h-3" />
                            {typeof rec.expected_impact === 'string'
                              ? rec.expected_impact
                              : JSON.stringify(rec.expected_impact)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons / status badge */}
                    <div className="flex md:flex-col gap-2 w-full md:w-36 shrink-0 border-t md:border-t-0 md:border-l border-outline-variant pt-4 md:pt-0 md:pl-6 items-center justify-center">
                      {isPending ? (
                        <>
                          <Button
                            className="flex-1 w-full"
                            onClick={() => handleAction(rec.id, 'accept')}
                            disabled={isActioning}
                          >
                            <Check className="w-4 h-4 mr-1.5" />
                            {isActioning ? '...' : 'Accept'}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 w-full"
                            onClick={() => handleAction(rec.id, 'reject')}
                            disabled={isActioning}
                          >
                            <X className="w-4 h-4 mr-1.5" />
                            {isActioning ? '...' : 'Reject'}
                          </Button>
                        </>
                      ) : (
                        <div className="text-center w-full py-2">
                          <Badge variant={rec.status === 'ACCEPTED' ? 'success' : 'outline'}>
                            {rec.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
