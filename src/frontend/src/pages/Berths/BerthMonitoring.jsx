import React, { useEffect, useState } from 'react';
import { Anchor, Activity, Clock } from 'lucide-react';
import { resourceApi } from '../../api/resourceApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export function BerthMonitoring() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await resourceApi.getBerths();
        setData(response);
      } catch (error) {
        console.error("Failed to load berths", error);
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
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Berth Monitoring</h1>
        <p className="text-sm text-on-surface-variant">Real-time status and utilization of terminal berths.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map(berth => (
          <Card key={berth.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{berth.name}</CardTitle>
                  <CardDescription>{berth.type}</CardDescription>
                </div>
                <Anchor className={`w-5 h-5 ${berth.status === 'Occupied' ? 'text-primary' : 'text-on-surface-variant'}`} />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Status</span>
                <Badge variant={
                  berth.status === 'Occupied' ? 'success' : 
                  berth.status === 'Maintenance' ? 'destructive' : 'default'
                }>
                  {berth.status}
                </Badge>
              </div>

              {berth.status === 'Occupied' ? (
                <div className="bg-surface-container-high p-3 rounded-md border border-outline-variant">
                  <span className="text-xs text-on-surface-variant block mb-1">Current Vessel</span>
                  <span className="text-sm font-semibold text-on-surface">{berth.currentVessel}</span>
                </div>
              ) : (
                <div className="bg-surface-container p-3 rounded-md border border-outline-variant flex items-center justify-center h-[62px]">
                  <span className="text-sm text-on-surface-variant">No vessel moored</span>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-on-surface-variant">Utilization (30d)</span>
                  <span className="text-xs font-mono font-medium">{berth.utilization}%</span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${berth.utilization > 80 ? 'bg-primary' : 'bg-secondary'}`}
                    style={{ width: `${berth.utilization}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-outline-variant flex items-center gap-2 text-xs text-on-surface-variant">
                <Clock className="w-3.5 h-3.5" />
                <span>Next Available: <span className="font-mono">{
                  berth.nextAvailable === 'Now' ? 'Now' : new Date(berth.nextAvailable).toLocaleString()
                }</span></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
