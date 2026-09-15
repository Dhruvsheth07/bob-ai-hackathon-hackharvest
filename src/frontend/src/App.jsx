import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/navigation/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { VesselManagement } from './pages/Vessels/VesselManagement';
import { VesselSchedule } from './pages/Schedule/VesselSchedule';
import { BerthMonitoring } from './pages/Berths/BerthMonitoring';
import { CraneMonitoring } from './pages/Cranes/CraneMonitoring';
import { CongestionPrediction } from './pages/Congestion/CongestionPrediction';
import { OptimizationCenter } from './pages/Optimization/OptimizationCenter';
import { Recommendations } from './pages/Recommendations/Recommendations';
import { OperationsPlan } from './pages/OperationsPlan/OperationsPlan';
import { Simulation } from './pages/Simulation/Simulation';
import { Profile } from './pages/Profile/Profile';
import { Settings } from './pages/Settings/Settings';
import { Reports } from './pages/Reports/Reports';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route path="vessels" element={<VesselManagement />} />
            <Route path="schedule" element={<VesselSchedule />} />
            <Route path="berths" element={<BerthMonitoring />} />
            <Route path="cranes" element={<CraneMonitoring />} />
            
            <Route path="congestion" element={<CongestionPrediction />} />
            <Route path="optimization" element={<OptimizationCenter />} />
            <Route path="recommendations" element={<Recommendations />} />
            
            <Route path="operations-plan" element={<OperationsPlan />} />
            <Route path="simulation" element={<Simulation />} />
            
            <Route path="reports" element={<Reports />} />

            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
