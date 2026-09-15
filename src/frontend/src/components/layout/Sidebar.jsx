import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
  LayoutDashboard, 
  Ship, 
  Calendar, 
  Anchor, 
  Tractor, 
  Activity, 
  Cpu, 
  Lightbulb, 
  Map, 
  PlaySquare, 
  PieChart, 
  HelpCircle 
} from 'lucide-react';

const navGroups = [
  {
    title: null,
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Vessels', to: '/vessels', icon: Ship },
      { name: 'Schedule', to: '/schedule', icon: Calendar },
      { name: 'Berths', to: '/berths', icon: Anchor },
      { name: 'Cranes', to: '/cranes', icon: Tractor }
    ]
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { name: 'Congestion', to: '/congestion', icon: Activity },
      { name: 'Optimization', to: '/optimization', icon: Cpu },
      { name: 'Recommendations', to: '/recommendations', icon: Lightbulb }
    ]
  },
  {
    title: 'PLANNING',
    items: [
      { name: 'Operations Plan', to: '/operations-plan', icon: Map },
      { name: 'Simulation', to: '/simulation', icon: PlaySquare }
    ]
  },
  {
    title: 'ANALYTICS',
    items: [
      { name: 'Reports', to: '/reports', icon: PieChart }
    ]
  }
];

export function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-outline-variant bg-surface-container-low flex flex-col h-full overflow-y-auto">
      <div className="h-16 flex items-center px-6 border-b border-outline-variant shrink-0">
        <span className="font-sans font-semibold text-lg tracking-tight text-primary">PORT OPTIMIZER</span>
      </div>
      
      <div className="flex-1 py-4 flex flex-col gap-6 px-3">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            {group.title && (
              <h4 className="px-3 mb-2 text-xs font-semibold text-on-surface-variant tracking-wider">
                {group.title}
              </h4>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive 
                        ? "bg-primary-container/10 text-primary font-medium" 
                        : "text-on-surface hover:bg-surface-container-high hover:text-on-surface"
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-outline-variant mt-auto">
        <NavLink
          to="/help"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive 
                ? "bg-primary-container/10 text-primary font-medium" 
                : "text-on-surface hover:bg-surface-container-high hover:text-on-surface"
            )
          }
        >
          <HelpCircle className="w-4 h-4" />
          Help
        </NavLink>
      </div>
    </aside>
  );
}
