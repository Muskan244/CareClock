import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/contexts/LocationContext";
import { LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import type { TimeRecord } from "@shared/schema";

interface ClockInOutCardProps {
  activeRecord: TimeRecord | null;
  note: string;
  onNoteChange: (note: string) => void;
  onClockAction: () => void;
}

export default function ClockInOutCard({ 
  activeRecord, 
  note, 
  onNoteChange,
  onClockAction 
}: ClockInOutCardProps) {
  const { toast } = useToast();
  const { location, validation, validateLocation } = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleClockIn = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enable location access to clock in.",
        variant: "destructive",
      });
      return;
    }

    await validateLocation();
    
    if (!validation?.isWithinPerimeter) {
      toast({
        title: "Outside Perimeter",
        description: "You must be within the hospital perimeter to clock in.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          location: 'Hospital Facility', // Could be enhanced with reverse geocoding
          note: note.trim() || undefined,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to clock in');
      }

      await response.json();
      onNoteChange(''); // Clear note after successful clock in
      onClockAction(); // Refresh active record
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/active-record'] });
      queryClient.invalidateQueries({ queryKey: ['/api/time-records'] });
      
      toast({
        title: "Clocked In Successfully",
        description: "You have been clocked in successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Clock In Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enable location access to clock out.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          location: 'Hospital Facility',
          note: note.trim() || undefined,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to clock out');
      }

      await response.json();
      onNoteChange(''); // Clear note after successful clock out
      onClockAction(); // Refresh active record
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/active-record'] });
      queryClient.invalidateQueries({ queryKey: ['/api/time-records'] });
      
      toast({
        title: "Clocked Out Successfully",
        description: "You have been clocked out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Clock Out Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {activeRecord ? (
        <Button
          onClick={handleClockOut}
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg border-2 border-red-500 transition-all duration-200 flex items-center justify-center space-x-3"
          data-testid="button-clock-out"
        >
          <LogOut className="text-xl" />
          <span className="text-lg">{isLoading ? 'Clocking Out...' : 'Clock Out'}</span>
        </Button>
      ) : (
        <Button
          onClick={handleClockIn}
          disabled={isLoading || !validation?.isWithinPerimeter}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 disabled:text-slate-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg border-2 border-green-500 transition-all duration-200 flex items-center justify-center space-x-3"
          data-testid="button-clock-in"
        >
          <LogIn className="text-xl" />
          <span className="text-lg">{isLoading ? 'Clocking In...' : 'Clock In'}</span>
        </Button>
      )}

      {!validation?.isWithinPerimeter && !activeRecord && (
        <p className="text-sm text-red-600 text-center" data-testid="text-perimeter-warning">
          You must be within the hospital perimeter to clock in
        </p>
      )}
    </div>
  );
}
