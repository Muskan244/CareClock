import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, MapPin } from "lucide-react";
import type { TimeRecord, User } from "@shared/schema";

interface StaffMember extends TimeRecord {
  user: User;
}

interface StaffTableProps {
  staff: StaffMember[];
  loading?: boolean;
}

export default function StaffTable({ staff, loading = false }: StaffTableProps) {
  const calculateHoursWorked = (clockInTime: string) => {
    const clockIn = new Date(clockInTime);
    const now = new Date();
    const diffMs = now.getTime() - clockIn.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatClockInTime = (clockInTime: string) => {
    return new Date(clockInTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Clock In Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Hours Worked</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center">
                    <Skeleton className="w-10 h-10 rounded-full mr-3" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!staff || staff.length === 0) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Clock In Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Hours Worked</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                No staff currently clocked in
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Staff Member
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Clock In Time
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Location
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Hours Worked
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-slate-200">
          {staff.map((staffMember) => (
            <TableRow key={staffMember.id} className="hover:bg-slate-50" data-testid={`row-staff-${staffMember.id}`}>
              <TableCell className="whitespace-nowrap">
                <div className="flex items-center">
                  {staffMember.user.profileImageUrl ? (
                    <img 
                      src={staffMember.user.profileImageUrl} 
                      alt="Staff member" 
                      className="w-10 h-10 rounded-full object-cover mr-3"
                      data-testid={`img-staff-${staffMember.id}`}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mr-3">
                      <span className="text-slate-600 text-sm font-medium">
                        {staffMember.user.firstName?.[0] || staffMember.user.email?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-slate-900" data-testid={`text-staff-name-${staffMember.id}`}>
                      {staffMember.user.firstName && staffMember.user.lastName 
                        ? `${staffMember.user.firstName} ${staffMember.user.lastName}`
                        : staffMember.user.email
                      }
                    </div>
                    <div className="text-sm text-slate-500" data-testid={`text-staff-role-${staffMember.id}`}>
                      {staffMember.user.department || 'Healthcare Professional'}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-slate-900" data-testid={`text-clock-in-${staffMember.id}`}>
                {formatClockInTime(staffMember.clockInTime)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="flex items-center">
                  <MapPin className="text-healthcare-green text-xs mr-1" />
                  <span className="text-sm text-slate-900" data-testid={`text-location-${staffMember.id}`}>
                    {staffMember.clockInLocation || 'Unknown Location'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-slate-900" data-testid={`text-hours-${staffMember.id}`}>
                {calculateHoursWorked(staffMember.clockInTime)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge 
                  variant="secondary"
                  className="bg-healthcare-green/10 text-healthcare-green border-healthcare-green/20"
                  data-testid={`badge-status-${staffMember.id}`}
                >
                  Active
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid={`button-view-${staffMember.id}`}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
