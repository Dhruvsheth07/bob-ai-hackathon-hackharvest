import React, { useEffect, useState } from 'react';
import { Map, Download, CheckCircle, Clock } from 'lucide-react';
import { planningApi } from '../../api/planningApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export function OperationsPlan() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await planningApi.getOperationsPlan();
        setData(response);
      } catch (error) {
        console.error("Failed to load operations plan", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">72-Hour Operations Plan</h1>
          <p className="text-sm text-on-surface-variant">Comprehensive outlook for berths, cranes, and expected congestion.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve Plan
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-5 bg-surface-container-low">
          <CardContent className="p-6 flex flex-wrap gap-8 justify-between items-center">
            <div>
              <span className="text-sm text-on-surface-variant block mb-1">Status</span>
              <Badge variant="warning">{data.status}</Badge>
            </div>
            <div>
              <span className="text-sm text-on-surface-variant block mb-1">Generated</span>
              <span className="font-mono text-on-surface flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(data.generatedAt).toLocaleString()}
              </span>
            </div>
            <div className="h-10 w-px bg-outline-variant hidden md:block"></div>
            <div>
              <span className="text-sm text-on-surface-variant block mb-1">Vessels Served</span>
              <span className="text-xl font-bold font-mono text-on-surface">{data.summary.vesselsServed}</span>
            </div>
            <div>
              <span className="text-sm text-on-surface-variant block mb-1">Total Moves</span>
              <span className="text-xl font-bold font-mono text-on-surface">{data.summary.totalMoves}</span>
            </div>
            <div>
              <span className="text-sm text-on-surface-variant block mb-1">Avg Berth Util.</span>
              <span className="text-xl font-bold font-mono text-on-surface">{data.summary.berthUtilization}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Allocation Matrix</CardTitle>
          <CardDescription>Berth assignments and required crane coverage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.allocations.map((alloc, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 border border-outline-variant rounded-md bg-surface hover:bg-surface-container-high transition-colors">
                <div className="w-48 shrink-0">
                  <h4 className="font-semibold text-on-surface">{alloc.berth}</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Assigned Cranes: <span className="font-mono text-on-surface">{alloc.cranes}</span></p>
                </div>
                <div className="flex-1 flex flex-wrap gap-2 items-center border-t md:border-t-0 md:border-l border-outline-variant pt-3 md:pt-0 md:pl-4">
                  <span className="text-xs text-on-surface-variant mr-2">Vessels:</span>
                  {alloc.vessels.map(vessel => (
                    <Badge key={vessel} variant="outline" className="bg-surface-container">{vessel}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
