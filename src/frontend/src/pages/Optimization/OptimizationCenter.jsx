import React, { useState } from 'react';
import { Cpu, Play, CheckCircle, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export function OptimizationCenter() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState(null);

  const handleRunOptimization = () => {
    setIsOptimizing(true);
    setResult(null);
    
    // Simulate optimization solver
    setTimeout(() => {
      setIsOptimizing(false);
      setResult({
        status: 'Optimal',
        solveTime: '12.4s',
        feasibility: '100%',
        metrics: [
          { name: 'Average Wait Time', current: '4.2h', optimized: '2.8h', improvement: '33%' },
          { name: 'Berth Utilization', current: '82%', optimized: '89%', improvement: '7%' },
          { name: 'Crane Idle Time', current: '14%', optimized: '5%', improvement: '9%' }
        ]
      });
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Optimization Center</h1>
        <p className="text-sm text-on-surface-variant">Run constraint programming models to generate optimal operational plans.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Controls */}
        <Card className="md:col-span-1 border-primary/20">
          <CardHeader className="bg-surface-container-low border-b border-outline-variant">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              Solver Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface mb-2 block">Objective</label>
                <select className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none">
                  <option>Minimize Wait Time</option>
                  <option>Maximize Throughput</option>
                  <option>Minimize Cost</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-on-surface mb-2 block">Time Horizon</label>
                <select className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none">
                  <option>72 Hours</option>
                  <option>48 Hours</option>
                  <option>24 Hours</option>
                </select>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleRunOptimization}
              isLoading={isOptimizing}
            >
              {isOptimizing ? 'Running Solver...' : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Optimization
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Pane */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {!result && !isOptimizing && (
            <Card className="flex-1 flex items-center justify-center border-dashed border-2 bg-transparent">
              <div className="text-center">
                <BarChart2 className="w-12 h-12 text-outline-variant mx-auto mb-3" />
                <h3 className="text-lg font-medium text-on-surface">No Active Plan</h3>
                <p className="text-sm text-on-surface-variant max-w-sm mt-1">Configure solver parameters and run optimization to generate a new 72-hour operational plan.</p>
              </div>
            </Card>
          )}

          {isOptimizing && (
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 w-full max-w-xs">
                <div className="flex justify-between text-xs font-mono text-on-surface-variant mb-1">
                  <span>Solving OR-Tools Model</span>
                  <span className="animate-pulse text-primary">Running...</span>
                </div>
                <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-1/2 animate-[pulse_1s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </Card>
          )}

          {result && !isOptimizing && (
            <>
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Optimization Complete</CardTitle>
                      <CardDescription>Solver found an optimal solution</CardDescription>
                    </div>
                    <Badge variant="success" className="text-sm px-3 py-1">
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Optimal
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-8 text-sm border-t border-outline-variant pt-4">
                    <div>
                      <span className="text-on-surface-variant block mb-1">Solve Time</span>
                      <span className="font-mono text-on-surface font-medium">{result.solveTime}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block mb-1">Feasibility</span>
                      <span className="font-mono text-on-surface font-medium">{result.feasibility}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Projected Metrics vs Baseline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.metrics.map((metric, idx) => (
                      <div key={idx} className="grid grid-cols-4 items-center p-3 border-b border-outline-variant last:border-0 hover:bg-surface-container transition-colors">
                        <span className="text-sm font-medium text-on-surface col-span-1">{metric.name}</span>
                        <div className="col-span-1 text-center">
                          <span className="text-xs text-on-surface-variant block mb-1">Current</span>
                          <span className="text-sm font-mono text-on-surface">{metric.current}</span>
                        </div>
                        <div className="col-span-1 text-center">
                          <span className="text-xs text-on-surface-variant block mb-1">Optimized</span>
                          <span className="text-sm font-mono text-primary font-bold">{metric.optimized}</span>
                        </div>
                        <div className="col-span-1 text-right">
                          <Badge variant="success">Improvement: {metric.improvement}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline">Discard</Button>
                <Button>Apply as 72H Plan</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
