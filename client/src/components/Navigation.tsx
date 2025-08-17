import { Button } from "@/components/ui/button";
import { Clock, MapPin } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import type { User } from "@shared/schema";

interface NavigationProps {
  user: User | null;
  currentView: 'manager' | 'worker';
  onViewChange: (view: 'manager' | 'worker') => void;
}

export default function Navigation({ user, currentView, onViewChange }: NavigationProps) {
  const { validation } = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="text-primary text-2xl" />
              <h1 className="text-xl font-bold text-slate-900" data-testid="text-app-title">CareTime</h1>
            </div>
            
            {/* Role toggle - show for testing purposes */}
            <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
                <Button
                  variant={currentView === 'manager' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('manager')}
                  className={currentView === 'manager' ? 'bg-white shadow-sm' : ''}
                  data-testid="button-manager-view"
                >
                  Manager
                </Button>
                <Button
                  variant={currentView === 'worker' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('worker')}
                  className={currentView === 'worker' ? 'bg-white shadow-sm' : ''}
                  data-testid="button-worker-view"
                >
                  Worker
                </Button>
              </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Location Status Indicator */}
            {validation && (
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                validation.isWithinPerimeter 
                  ? 'bg-healthcare-green/10' 
                  : 'bg-red-100'
              }`}>
                <MapPin className={`text-sm ${
                  validation.isWithinPerimeter 
                    ? 'text-healthcare-green' 
                    : 'text-red-500'
                }`} />
                <span className={`text-sm font-medium ${
                  validation.isWithinPerimeter 
                    ? 'text-healthcare-green' 
                    : 'text-red-500'
                }`} data-testid="text-location-status">
                  {validation.isWithinPerimeter ? 'In Perimeter' : 'Outside Perimeter'}
                </span>
              </div>
            )}
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="User profile" 
                  className="w-8 h-8 rounded-full object-cover" 
                  data-testid="img-user-avatar"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="text-slate-600 text-sm font-medium">
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-slate-700 hidden sm:block" data-testid="text-user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || 'User'
                }
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
