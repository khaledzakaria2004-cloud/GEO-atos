import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const SidebarNavigation = ({ 
  isOpen = false, 
  onClose,
  className = ""
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'Home',
      tooltip: 'Workout overview and quick start'
    },
    {
      label: 'Exercises',
      path: '/exercise-library',
      icon: 'Dumbbell',
      tooltip: 'Browse our collection of exercises'
    },
    // Schedule removed per request
    {
      label: 'AI Chatbot',
      path: '/ai-chat',
      icon: 'MessageCircle',
      tooltip: 'Chat with your AI fitness assistant'
    },
    {
      label: 'Food Scanner',
      path: '/food-scanner',
      icon: 'ScanLine',
      tooltip: 'Analyze food nutrition with your camera'
    },
    
    {
      label: 'Profile',
      path: '/user-profile',
      icon: 'User',
      tooltip: 'Personal metrics and achievements'
    }
    ,
    {
      label: 'Achievements',
      path: '/achievements',
      icon: 'Trophy',
      tooltip: 'View all your earned achievements and progress'
    }
  ];

  // Add Community at the end
  navigationItems.push({
    label: 'Community',
    path: '/community',
    icon: 'Users',
    tooltip: 'Share workouts & posts – Coming soon!'
  });

  const secondaryItems = [];

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isActivePath = (path) => {
    return location?.pathname === path;
  };

  const NavItem = ({ item, isActive }) => (
    <button
      onClick={() => handleNavigation(item?.path)}
      className={`
        flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-left transition-all duration-200
        ${isActive 
          ? 'bg-primary text-primary-foreground shadow-elevation-1' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }
        group relative
      `}
      title={item?.tooltip}
    >
      <Icon 
        name={item?.icon} 
        size={20} 
        className={`${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}
      />
      <span className="font-medium text-sm">{item?.label}</span>
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute right-2 w-2 h-2 bg-primary-foreground rounded-full"></div>
      )}
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-sidebar lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-card border-r border-border z-sidebar
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${className}
      `}>
        <div className="flex flex-col h-full">
          {/* Navigation Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-card-foreground">Navigation</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden"
                aria-label="Close sidebar"
              >
                <Icon name="X" size={18} />
              </Button>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="flex-1 p-4 space-y-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                Main
              </p>
              {navigationItems?.map((item) => (
                <NavItem
                  key={item?.path}
                  item={item}
                  isActive={isActivePath(item?.path)}
                />
              ))}
            </div>

            {/* Secondary Navigation */}
            {secondaryItems?.length > 0 && (
              <div className="pt-6 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                  Support
                </p>
                {secondaryItems?.map((item) => (
                  <NavItem
                    key={item?.path}
                    item={item}
                    isActive={isActivePath(item?.path)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            
          </div>
        </div>
      </aside>
      {/* Main content spacer for desktop */}
      <div className="hidden lg:block w-72 flex-shrink-0"></div>
    </>
  );
};

export default SidebarNavigation;