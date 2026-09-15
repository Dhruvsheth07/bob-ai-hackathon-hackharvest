import React, { useEffect, useState } from 'react';
import { Tractor, Wrench, CheckCircle } from 'lucide-react';
import { resourceApi } from '../../api/resourceApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export function CraneMonitoring() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await resourceApi.getCranes();
        setData(response);
      } catch (error) {
        console.error("Failed to load cranes", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Crane Monitoring</h1>
        <p className="text-sm text-on-surface-variant">Real-time status, efficiency, and assignments of terminal cranes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map(crane => (
          <Card key={crane.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${
                    crane.status === 'Working' ? 'bg-primary-container/20 text-primary' :
                    crane.status === 'Maintenance' ? 'bg-error-container text-error' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    <Tractor className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{crane.name}</CardTitle>
                    <CardDescription className="text-xs">{crane.id}</CardDescription>
                  </div>
                </div>
                <Badge variant={
                  crane.status === 'Working' ? 'success' : 
                  crane.status === 'Maintenance' ? 'destructive' : 'outline'
                }>
                  {crane.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-4 border-t border-outline-variant mt-2">
              <div>
                <span className="text-xs text-on-surface-variant block mb-1">Assigned Berth</span>
                <span className="text-sm font-semibold text-on-surface">{crane.assignedBerth || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block mb-1">Efficiency</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-on-surface">{crane.efficiency}%</span>
                  {crane.efficiency > 90 ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : null}
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-2 text-xs text-on-surface-variant mt-2">
                <Wrench className="w-3.5 h-3.5" />
                <span>Last Maintenance: <span className="font-mono">{crane.lastMaintenance}</span></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
