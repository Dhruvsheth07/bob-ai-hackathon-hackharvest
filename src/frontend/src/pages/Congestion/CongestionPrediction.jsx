import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, ShieldAlert } from 'lucide-react';
import { intelligenceApi } from '../../api/intelligenceApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export function CongestionPrediction() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await intelligenceApi.getCongestionData();
        setData(response);
      } catch (error) {
        console.error("Failed to load congestion data", error);
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Congestion Prediction</h1>
          <p className="text-sm text-on-surface-variant">AI-driven terminal congestion forecasting and risk analysis.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-on-surface-variant font-mono mb-1">Model Version: {data.modelVersion}</p>
          <Badge variant="outline" className="text-primary border-primary/50 bg-primary-container/10">
            Confidence: {data.confidence}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-on-surface-variant">Current Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-on-surface">{data.currentScore}/100</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-on-surface-variant">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-warning" />
              <div className="text-xl font-bold text-on-surface">{data.riskLevel}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-on-surface-variant">Predicted Peak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium font-mono text-on-surface">{new Date(data.predictedPeak).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>24-Hour Congestion Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.forecast24h}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
                  <XAxis dataKey="time" stroke="var(--on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-container-high)', borderColor: 'var(--outline-variant)', color: 'var(--on-surface)' }}
                    itemStyle={{ color: 'var(--warning)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--warning)" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contributing Factors</CardTitle>
            <CardDescription>Primary drivers of predicted congestion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.factors.map((factor, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border border-outline-variant rounded-md bg-surface-container">
                  <span className="text-sm font-medium text-on-surface">{factor.name}</span>
                  <Badge variant="destructive">{factor.impact}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
