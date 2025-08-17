import { useQuery } from "@tanstack/react-query";
import ClockInOutCard from "@/components/worker/ClockInOutCard";
import LocationStatus from "@/components/worker/LocationStatus";
import LocationModal from "@/components/LocationModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "@/contexts/LocationContext";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function WorkerDashboard() {
  const { user } = useAuth();
  const { hasPermission } = useLocation();
  const [note, setNote] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);

  const { data: activeRecord, refetch: refetchActiveRecord } = useQuery({
    queryKey: ['/api/active-record'],
  });

  const { data: todayRecords } = useQuery({
    queryKey: ['/api/time-records'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const response = await fetch(
        `/api/time-records?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch records');
      }
      
      return response.json();
    },
  });

  // Show location modal if no permission
  useEffect(() => {
    if (!hasPermission) {
      const timer = setTimeout(() => setShowLocationModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasPermission]);

  const calculateTodayHours = () => {
    if (!todayRecords || todayRecords.length === 0) return "0h 0m";
    
    let totalMinutes = 0;
    
    todayRecords.forEach((record: any) => {
      if (record.clockInTime) {
        const clockIn = new Date(record.clockInTime);
        const clockOut = record.clockOutTime ? new Date(record.clockOutTime) : new Date();
        const diffMs = clockOut.getTime() - clockIn.getTime();
        totalMinutes += Math.floor(diffMs / (1000 * 60));
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getClockInTime = () => {
    if (!activeRecord) return "-";
    return new Date(activeRecord.clockInTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Worker Status Card */}
      <Card className="rounded-2xl shadow-sm border border-slate-200 p-6 mb-6" data-testid="card-worker-status">
        <div className="text-center">
          <div className="w-20 h-20 bg-healthcare-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-healthcare-green text-2xl">👨‍⚕️</div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-1" data-testid="text-worker-name">
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.email || 'Healthcare Worker'
            }
          </h2>
          <p className="text-sm text-slate-600" data-testid="text-worker-role">
            {user?.department || 'Healthcare Professional'}
          </p>
          
          {/* Current Status */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${activeRecord ? 'bg-healthcare-green animate-pulse' : 'bg-slate-400'}`}></div>
              <span className="text-sm font-medium text-slate-900" data-testid="text-worker-status">
                {activeRecord ? 'Currently Clocked In' : 'Not Clocked In'}
              </span>
            </div>
            {activeRecord && (
              <p className="text-xs text-slate-600">
                Since <span data-testid="text-clock-in-time">{getClockInTime()}</span> • <span data-testid="text-duration">{calculateTodayHours()}</span>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Clock In/Out Actions */}
      <ClockInOutCard 
        activeRecord={activeRecord}
        note={note}
        onNoteChange={setNote}
        onClockAction={refetchActiveRecord}
      />

      {/* Location Status */}
      <LocationStatus />

      {/* Quick Notes */}
      <Card className="rounded-xl shadow-sm border border-slate-200 p-4 mb-6" data-testid="card-notes">
        <CardHeader className="p-0 mb-3">
          <CardTitle className="text-sm font-medium text-slate-900">Add Note (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
            placeholder="Add any notes about your shift..."
            data-testid="textarea-notes"
          />
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card className="rounded-xl shadow-sm border border-slate-200 p-4" data-testid="card-summary">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-sm font-medium text-slate-900">Today's Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Clock In Time</span>
              <span className="text-sm font-medium text-slate-900" data-testid="text-today-clock-in">
                {getClockInTime()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Hours Worked</span>
              <span className="text-sm font-medium text-slate-900" data-testid="text-today-hours">
                {calculateTodayHours()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Department</span>
              <span className="text-sm font-medium text-slate-900" data-testid="text-today-department">
                {user?.department || 'Not specified'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Permission Modal */}
      <LocationModal 
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
}
