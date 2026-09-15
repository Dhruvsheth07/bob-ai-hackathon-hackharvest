import React from 'react';
import { Bell, Search } from 'lucide-react';
import { ProfileMenu } from '../navigation/ProfileMenu';

export function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-outline-variant bg-surface-container-low shrink-0">
      <div className="flex-1 flex items-center max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Search vessels, berths, or container IDs..." 
            className="w-full bg-surface-container border border-outline-variant rounded-md pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-on-surface-variant"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-4">
        <button className="relative p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface-container-low"></span>
        </button>
        
        <div className="w-px h-6 bg-outline-variant"></div>
        
        <ProfileMenu />
      </div>
    </header>
  );
}
