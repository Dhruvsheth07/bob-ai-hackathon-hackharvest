import React from 'react';
import { Moon, Sun, Monitor, Bell, Shield, Activity, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import Button from '../../components/common/Button';

export function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Settings</h1>
        <p className="text-sm text-on-surface-variant">Manage your application preferences and security.</p>
      </div>

      <div className="grid gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how Port Optimizer looks on your device.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 max-w-lg">
              <button className="flex flex-col items-center gap-2 p-4 border border-outline-variant rounded-md hover:bg-surface-container transition-colors">
                <Sun className="w-6 h-6 text-on-surface-variant" />
                <span className="text-sm font-medium text-on-surface">Light</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-primary bg-primary-container/10 rounded-md transition-colors">
                <Moon className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-primary">Dark</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border border-outline-variant rounded-md hover:bg-surface-container transition-colors">
                <Monitor className="w-6 h-6 text-on-surface-variant" />
                <span className="text-sm font-medium text-on-surface">System</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Configure your default operational views.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-w-xl">
            <div>
              <label className="text-sm font-medium text-on-surface mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-on-surface-variant" /> Default Time Range
              </label>
              <select className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none">
                <option>24 Hours</option>
                <option>48 Hours</option>
                <option selected>72 Hours</option>
                <option>7 Days</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-on-surface mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-on-surface-variant" /> Default Terminal
              </label>
              <select className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none">
                <option selected>Terminal A (Deep Water)</option>
                <option>Terminal B (Standard)</option>
                <option>All Terminals</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose what alerts you want to receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-md border border-outline-variant">
              <div>
                <h4 className="text-sm font-medium text-on-surface flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Operational Alerts
                </h4>
                <p className="text-xs text-on-surface-variant mt-1">Updates on vessel arrivals and berthing.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-md border border-outline-variant">
              <div>
                <h4 className="text-sm font-medium text-on-surface flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-error" /> Critical Congestion Alerts
                </h4>
                <p className="text-xs text-on-surface-variant mt-1">Immediate warnings when congestion exceeds 80%.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary" />
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-md border border-outline-variant">
              <div>
                <h4 className="text-sm font-medium text-on-surface flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" /> AI Recommendations
                </h4>
                <p className="text-xs text-on-surface-variant mt-1">Notifications when new optimal plans are available.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button>Save Settings</Button>
      </div>
    </div>
  );
}
