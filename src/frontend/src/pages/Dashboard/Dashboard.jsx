import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Ship, Anchor, Activity, Clock, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '../../api/dashboardApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export function Dashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await dashboardApi.getDashboardData();
        setData(response);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Operations Dashboard</h1>
        <p className="text-sm text-on-surface-variant">Real-time terminal overview and AI recommendations.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">Active Vessels</CardTitle>
            <Ship className="h-4 w-4 text-on-surface-variant" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-on-surface">{data.kpis.activeVessels}</div>
            <p className="text-xs text-on-surface-variant mt-1 flex items-center">
              <span className="text-success flex items-center"><ArrowUpRight className="h-3 w-3 mr-1" /> 12%</span>
              <span className="ml-2">vs last week</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">Congestion Score</CardTitle>
            <Activity className="h-4 w-4 text-on-surface-variant" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-on-surface">{data.kpis.congestionScore}/100</div>
            <p className="text-xs text-on-surface-variant mt-1 flex items-center">
              <span className="text-warning flex items-center"><ArrowUpRight className="h-3 w-3 mr-1" /> 5</span>
              <span className="ml-2">from yesterday</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">Berth Utilization</CardTitle>
            <Anchor className="h-4 w-4 text-on-surface-variant" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-on-surface">{data.kpis.berthUtilization}%</div>
            <p className="text-xs text-on-surface-variant mt-1 flex items-center">
              <span className="text-success flex items-center"><ArrowUpRight className="h-3 w-3 mr-1" /> 2.1%</span>
              <span className="ml-2">vs last month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-on-surface-variant" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-on-surface">{data.kpis.avgWaitTime}</div>
            <p className="text-xs text-on-surface-variant mt-1 flex items-center">
              <span className="text-success flex items-center"><ArrowDownRight className="h-3 w-3 mr-1" /> 0.5h</span>
              <span className="ml-2">vs last week</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Congestion Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>24-Hour Congestion Forecast</CardTitle>
            <CardDescription>Predicted terminal congestion score based on vessel ETAs and crane availability.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.congestionHistory}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
                  <XAxis dataKey="time" stroke="var(--on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-container-high)', borderColor: 'var(--outline-variant)', color: 'var(--on-surface)' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Actionable Recommendations */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>AI Recommendations</CardTitle>
            <CardDescription>Automated operational interventions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recommendations.map(rec => (
                <div key={rec.id} className="flex gap-4 items-start p-3 border border-outline-variant rounded-md bg-surface">
                  <AlertTriangle className={`w-5 h-5 shrink-0 ${rec.type === 'Critical' ? 'text-error' : 'text-warning'}`} />
                  <div>
                    <h4 className="text-sm font-semibold text-on-surface">{rec.type}</h4>
                    <p className="text-sm text-on-surface-variant mt-1">{rec.text}</p>
                    <div className="flex gap-2 mt-3">
                      <button className="text-xs font-medium text-primary hover:text-primary-container">Review</button>
                      <button className="text-xs font-medium text-on-surface-variant hover:text-on-surface">Dismiss</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vessel Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Incoming Vessel Queue</CardTitle>
          <CardDescription>Vessels scheduled for berthing in the next 12 hours.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto rounded-md border border-outline-variant">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-medium">
                <tr>
                  <th className="p-4">Vessel ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">ETA</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface">
                {data.vesselQueue.map(vessel => (
                  <tr key={vessel.id} className="hover:bg-surface-container-high transition-colors">
                    <td className="p-4 font-mono text-on-surface">{vessel.id}</td>
                    <td className="p-4 font-medium text-on-surface">{vessel.name}</td>
                    <td className="p-4 text-on-surface-variant">{vessel.type}</td>
                    <td className="p-4 font-mono text-on-surface-variant">{vessel.eta}</td>
                    <td className="p-4">
                      <Badge variant={
                        vessel.status === 'Waiting' ? 'warning' : 
                        vessel.status === 'Approaching' ? 'success' : 'default'
                      }>
                        {vessel.status}
                      </Badge>
                    </td>
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
