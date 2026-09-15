import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-surface-container-high p-1.5 rounded-md transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold text-sm">
          {currentUser.name.charAt(0)}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-on-surface leading-tight">{currentUser.name}</p>
          <p className="text-xs text-on-surface-variant leading-tight">{currentUser.role}</p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface border border-outline-variant rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-outline-variant sm:hidden">
            <p className="text-sm font-medium text-on-surface truncate">{currentUser.name}</p>
            <p className="text-xs text-on-surface-variant truncate">{currentUser.email}</p>
          </div>
          
          <NavLink 
            to="/profile" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <User className="w-4 h-4 text-on-surface-variant" />
            My Profile
          </NavLink>
          
          <NavLink 
            to="/settings" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <Settings className="w-4 h-4 text-on-surface-variant" />
            Settings
          </NavLink>
          
          <div className="border-t border-outline-variant mt-1 pt-1">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error-container hover:text-on-error-container transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
