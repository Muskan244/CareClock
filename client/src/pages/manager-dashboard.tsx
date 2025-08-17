import { useQuery } from "@tanstack/react-query";
import AnalyticsCard from "@/components/analytics/AnalyticsCard";
import StaffTable from "@/components/staff/StaffTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Filter, Download, Hospital, Info } from "lucide-react";

export default function ManagerDashboard() {
  const { toast } = useToast();
  const [perimeterRadius, setPerimeterRadius] = useState([2]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/manager/analytics'],
  });

  const { data: activeStaff, isLoading: staffLoading } = useQuery({
    queryKey: ['/api/manager/active-staff'],
  });

  const { data: locationSettings } = useQuery({
    queryKey: ['/api/location-settings'],
  });

  const handlePerimeterUpdate = async () => {
    try {
      const response = await fetch('/api/location-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospitalName: locationSettings?.hospitalName || 'Metropolitan General Hospital',
          hospitalAddress: locationSettings?.hospitalAddress || '123 Medical Drive',
          latitude: locationSettings?.latitude || '40.7128',
          longitude: locationSettings?.longitude || '-74.0060',
          perimeterRadius: perimeterRadius[0].toString(),
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update perimeter');
      }

      toast({
        title: "Settings Updated",
        description: `Perimeter radius updated to ${perimeterRadius[0]}km`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update perimeter settings",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2" data-testid="text-dashboard-title">
          Manager Dashboard
        </h2>
        <p className="text-slate-600" data-testid="text-dashboard-description">
          Monitor staff attendance and track working hours
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnalyticsCard
          title="Currently Clocked In"
          value={analytics?.currentlyClocked || 0}
          icon="users"
          trend={{ value: 12, type: "increase", label: "from yesterday" }}
          loading={analyticsLoading}
          testId="card-currently-clocked"
        />
        <AnalyticsCard
          title="Avg Hours Today"
          value={analytics?.avgHours || 0}
          icon="clock"
          trend={{ value: 0.3, type: "increase", label: "from average", suffix: "h" }}
          loading={analyticsLoading}
          testId="card-avg-hours"
        />
        <AnalyticsCard
          title="Daily Check-ins"
          value={analytics?.dailyCheckins || 0}
          icon="sign-in"
          trend={{ 
            value: analytics?.dailyCheckins - analytics?.yesterdayCheckins || 0, 
            type: (analytics?.dailyCheckins || 0) >= (analytics?.yesterdayCheckins || 0) ? "increase" : "decrease", 
            label: "from yesterday" 
          }}
          loading={analyticsLoading}
          testId="card-daily-checkins"
        />
        <AnalyticsCard
          title="Location Compliance"
          value={analytics?.compliance || 96}
          suffix="%"
          icon="map-pin"
          trend={{ value: 2, type: "increase", label: "this week", suffix: "%" }}
          loading={analyticsLoading}
          testId="card-compliance"
        />
      </div>

      {/* Currently Clocked In Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900" data-testid="text-staff-table-title">
              Currently Clocked In Staff
            </h3>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                data-testid="button-filter"
              >
                <Filter className="w-4 h-4 mr-1" />
                Filter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
        
        <StaffTable staff={activeStaff || []} loading={staffLoading} />
      </div>

      {/* Location Perimeter Settings */}
      <Card data-testid="card-location-settings">
        <CardHeader>
          <CardTitle>Location Perimeter Settings</CardTitle>
          <CardDescription>
            Configure the allowed area for staff to clock in and out
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hospital Location
                </label>
                <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                  <Hospital className="text-primary w-5 h-5" />
                  <span className="text-sm text-slate-900" data-testid="text-hospital-address">
                    {locationSettings?.hospitalAddress || 'Metropolitan General Hospital, 123 Medical Drive'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Perimeter Radius
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Slider
                      value={perimeterRadius}
                      onValueChange={setPerimeterRadius}
                      max={5}
                      min={0.5}
                      step={0.5}
                      className="w-full"
                      data-testid="slider-perimeter"
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-900 bg-slate-100 px-3 py-1 rounded-lg min-w-[60px] text-center">
                    {perimeterRadius[0]} km
                  </span>
                </div>
                <Button 
                  onClick={handlePerimeterUpdate}
                  className="mt-3"
                  size="sm"
                  data-testid="button-update-perimeter"
                >
                  Update Perimeter
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Info className="text-primary w-5 h-5" />
                  <span className="text-sm text-slate-700">
                    Current perimeter covers the main hospital building and parking areas
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-100 rounded-lg p-4 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Hospital className="w-8 h-8" />
                </div>
                <p className="text-sm">Interactive Map View</p>
                <p className="text-xs text-slate-400">Map visualization would be implemented here</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
