import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import ManagerDashboard from "@/pages/manager-dashboard";
import WorkerDashboard from "@/pages/worker-dashboard";
import { LocationProvider } from "@/contexts/LocationContext";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'manager' | 'worker'>('worker');

  useEffect(() => {
    if (user) {
      setCurrentView(user.role === 'manager' ? 'manager' : 'worker');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <LocationProvider>
      <div className="min-h-screen bg-slate-50">
        <Navigation 
          user={user || null}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        
        {currentView === 'manager' ? (
          <ManagerDashboard />
        ) : (
          <WorkerDashboard />
        )}
      </div>
    </LocationProvider>
  );
}
