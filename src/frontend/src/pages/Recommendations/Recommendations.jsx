import React, { useEffect, useState } from 'react';
import { Lightbulb, Check, X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { intelligenceApi } from '../../api/intelligenceApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';

export function Recommendations() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await intelligenceApi.getRecommendations();
        setData(response);
      } catch (error) {
        console.error("Failed to load recommendations", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAction = (id, newStatus) => {
    setData(current => current.map(rec => rec.id === id ? { ...rec, status: newStatus } : rec));
  };

  const IconMap = {
    'Critical': AlertCircle,
    'Warning': AlertTriangle,
    'Info': Info
  };

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
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">AI Recommendations</h1>
        <p className="text-sm text-on-surface-variant">Review and action intelligent operational suggestions.</p>
      </div>

      <div className="grid gap-4">
        {data.map(rec => {
          const Icon = IconMap[rec.severity] || Lightbulb;
          const isPending = rec.status === 'Pending';
          
          return (
            <Card key={rec.id} className={!isPending ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-full mt-1 shrink-0 ${
                      rec.severity === 'Critical' ? 'bg-error-container text-error' :
                      rec.severity === 'Warning' ? 'bg-warning/20 text-warning' : 'bg-primary-container text-on-primary-container'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{rec.type}</Badge>
                        <span className="text-xs text-on-surface-variant">{rec.timestamp}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-on-surface">{rec.title}</h3>
                      <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">{rec.explanation}</p>
                      
                      <div className="flex gap-6 mt-4">
                        <div>
                          <span className="text-xs text-on-surface-variant block uppercase tracking-wider">Affected Resource</span>
                          <span className="text-sm font-medium font-mono text-on-surface">{rec.affectedResource}</span>
                        </div>
                        <div>
                          <span className="text-xs text-on-surface-variant block uppercase tracking-wider">Expected Impact</span>
                          <span className="text-sm font-medium text-success">{rec.expectedImpact}</span>
                        </div>
                        <div>
                          <span className="text-xs text-on-surface-variant block uppercase tracking-wider">AI Confidence</span>
                          <span className="text-sm font-medium font-mono text-on-surface">{rec.confidence}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 w-full md:w-32 shrink-0 border-t md:border-t-0 md:border-l border-outline-variant pt-4 md:pt-0 md:pl-6 justify-center">
                    {isPending ? (
                      <>
                        <Button 
                          className="flex-1 w-full" 
                          onClick={() => handleAction(rec.id, 'Accepted')}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 w-full"
                          onClick={() => handleAction(rec.id, 'Rejected')}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <div className="text-center w-full py-2">
                        <Badge variant={rec.status === 'Accepted' ? 'success' : 'outline'}>
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
    </div>
  );
}
