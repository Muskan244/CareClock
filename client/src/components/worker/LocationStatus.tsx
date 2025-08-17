import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/contexts/LocationContext";
import { MapPin, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function LocationStatus() {
  const { validation, isLoading, validateLocation, hasPermission } = useLocation();

  const handleRefresh = () => {
    validateLocation();
  };

  return (
    <Card className="rounded-xl shadow-sm border border-slate-200 p-4 mb-6" data-testid="card-location-status">
      <CardHeader className="p-0 mb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-900">Location Status</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            data-testid="button-refresh-location"
          >
            <RefreshCw className={`text-sm ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {!hasPermission ? (
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-slate-900" data-testid="text-permission-required">
                Location Permission Required
              </p>
              <p className="text-xs text-slate-600">Enable location access to see your status</p>
            </div>
          </div>
        ) : validation ? (
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            validation.isWithinPerimeter 
              ? 'bg-healthcare-green/10' 
              : 'bg-red-50'
          }`}>
            {validation.isWithinPerimeter ? (
              <CheckCircle className="text-healthcare-green" />
            ) : (
              <AlertCircle className="text-red-500" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                validation.isWithinPerimeter 
                  ? 'text-slate-900' 
                  : 'text-slate-900'
              }`} data-testid="text-perimeter-status">
                {validation.isWithinPerimeter ? 'Within Perimeter' : 'Outside Perimeter'}
              </p>
              <p className="text-xs text-slate-600" data-testid="text-distance">
                {validation.distance}km from hospital center
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
            <MapPin className="text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-900" data-testid="text-checking-location">
                Checking Location...
              </p>
              <p className="text-xs text-slate-600">Please wait while we verify your location</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
