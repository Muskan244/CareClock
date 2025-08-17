import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationValidation {
  isWithinPerimeter: boolean;
  distance: number;
  perimeterRadius: number;
}

interface LocationContextType {
  location: LocationData | null;
  validation: LocationValidation | null;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  validateLocation: () => Promise<void>;
  hasPermission: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [validation, setValidation] = useState<LocationValidation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const { toast } = useToast();

  // Check if geolocation is supported
  const isSupported = 'geolocation' in navigator;

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    if (!isSupported) return;

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setHasPermission(permission.state === 'granted');
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setLocation(locationData);
      setHasPermission(true);
      
      // Automatically validate location after getting it
      await validateLocationData(locationData);
      
      toast({
        title: "Location access enabled",
        description: "Your location has been successfully detected.",
      });
    } catch (error: any) {
      let errorMessage = 'Failed to get location';
      
      if (error.code === 1) {
        errorMessage = 'Location access denied';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable';
      } else if (error.code === 3) {
        errorMessage = 'Location request timeout';
      }

      setError(errorMessage);
      setHasPermission(false);
      
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateLocationData = async (locationData: LocationData) => {
    try {
      const response = await fetch('/api/validate-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to validate location');
      }

      const validationData = await response.json();
      setValidation(validationData);

      if (!validationData.isWithinPerimeter) {
        toast({
          title: "Outside Perimeter",
          description: `You are ${validationData.distance}km from the hospital. You must be within ${validationData.perimeterRadius}km to clock in.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error validating location:', error);
      setError('Failed to validate location');
    }
  };

  const validateLocation = async () => {
    if (!location) {
      await requestPermission();
      return;
    }

    setIsLoading(true);
    await validateLocationData(location);
    setIsLoading(false);
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        validation,
        isLoading,
        error,
        requestPermission,
        validateLocation,
        hasPermission,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
