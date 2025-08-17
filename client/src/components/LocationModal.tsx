import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LocationModal({ open, onClose }: LocationModalProps) {
  const { requestPermission, isLoading } = useLocation();

  const handleEnableLocation = async () => {
    await requestPermission();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm" data-testid="modal-location">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="text-primary text-2xl" />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold text-slate-900 mb-2">
              Location Access Required
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mb-6">
              We need access to your location to verify you're within the hospital perimeter for clocking in and out.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <Button 
              onClick={handleEnableLocation}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-blue-600"
              data-testid="button-enable-location"
            >
              {isLoading ? 'Getting Location...' : 'Enable Location'}
            </Button>
            <Button 
              variant="ghost"
              onClick={onClose}
              className="w-full text-slate-600 hover:text-slate-800"
              data-testid="button-maybe-later"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
