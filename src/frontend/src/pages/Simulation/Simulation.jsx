import React, { useEffect, useState } from 'react';
import { PlaySquare, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { planningApi } from '../../api/planningApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export function Simulation() {
  const [context, setContext] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadContext() {
      const data = await planningApi.getSimulationContext();
      setContext(data);
      if (data.scenarios.length > 0) {
        setSelectedScenario(data.scenarios[0]);
      }
    }
    loadContext();
  }, []);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setResult(null);
    try {
      const res = await planningApi.runSimulation(selectedScenario);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!context) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold tracking-tight text-on-surface">What-If Simulation</h1>
            <Badge variant="outline" className="text-warning border-warning bg-warning/10 animate-pulse">
              SIMULATION MODE
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant">Test disaster and disruption scenarios without affecting the live plan.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-primary/20 bg-surface-container-low">
          <CardHeader>
            <CardTitle>Scenario Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-on-surface mb-2 block">Select Event</label>
              <select 
                className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
              >
                {context.scenarios.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div className="pt-4 border-t border-outline-variant">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Baseline Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Avg Wait:</span>
                  <span className="font-mono text-on-surface">{context.defaultBaseline.avgWaitTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Throughput:</span>
                  <span className="font-mono text-on-surface">{context.defaultBaseline.throughput}</span>
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleRunSimulation}
              isLoading={isSimulating}
              variant="destructive"
            >
              {!isSimulating && <PlaySquare className="w-4 h-4 mr-2" />}
              {isSimulating ? 'Simulating...' : 'Run Simulation'}
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          {!result && !isSimulating && (
            <Card className="h-full min-h-[300px] flex items-center justify-center border-dashed border-2 bg-transparent">
              <div className="text-center text-on-surface-variant">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a scenario and run the simulation to see projected impact.</p>
              </div>
            </Card>
          )}

          {isSimulating && (
            <Card className="h-full min-h-[300px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-error mx-auto"></div>
                <p className="text-sm font-mono text-on-surface-variant animate-pulse">Running Monte Carlo simulation...</p>
              </div>
            </Card>
          )}

          {result && !isSimulating && (
            <div className="space-y-4">
              <Card className="border-error/50 bg-error-container/5">
                <CardHeader className="pb-3 border-b border-error/20">
                  <CardTitle className="text-error flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Simulation Impact: {selectedScenario}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-surface border border-outline-variant rounded-md text-center">
                      <span className="text-xs text-on-surface-variant block mb-1">Avg Wait Time</span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm text-on-surface-variant line-through">{context.defaultBaseline.avgWaitTime}</span>
                        <ArrowRight className="w-3 h-3 text-error" />
                        <span className="text-lg font-bold text-error">{result.avgWaitTime}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-surface border border-outline-variant rounded-md text-center">
                      <span className="text-xs text-on-surface-variant block mb-1">Throughput</span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm text-on-surface-variant line-through">{context.defaultBaseline.throughput}</span>
                        <ArrowRight className="w-3 h-3 text-error" />
                        <span className="text-lg font-bold text-error">{result.throughput}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-surface border border-outline-variant rounded-md text-center">
                      <span className="text-xs text-on-surface-variant block mb-1">Congestion Max</span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm text-on-surface-variant line-through">{context.defaultBaseline.congestionMax}</span>
                        <ArrowRight className="w-3 h-3 text-error" />
                        <span className="text-lg font-bold text-error">{result.congestionMax}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-on-surface mb-2">Recommended Mitigation</h4>
                    <div className="bg-primary-container/10 border border-primary/30 p-4 rounded-md">
                      <p className="text-sm text-on-surface">{result.mitigation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
