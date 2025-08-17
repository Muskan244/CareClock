import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Clock, LogIn, MapPin, TrendingUp, TrendingDown } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: 'users' | 'clock' | 'sign-in' | 'map-pin';
  trend?: {
    value: number;
    type: 'increase' | 'decrease';
    label: string;
    suffix?: string;
  };
  loading?: boolean;
  testId?: string;
}

const iconMap = {
  'users': Users,
  'clock': Clock,
  'sign-in': LogIn,
  'map-pin': MapPin,
};

const iconColorMap = {
  'users': 'text-healthcare-green',
  'clock': 'text-primary',
  'sign-in': 'text-blue-500',
  'map-pin': 'text-purple-500',
};

const iconBgMap = {
  'users': 'bg-healthcare-green/10',
  'clock': 'bg-primary/10',
  'sign-in': 'bg-blue-500/10',
  'map-pin': 'bg-purple-500/10',
};

export default function AnalyticsCard({ 
  title, 
  value, 
  suffix = '', 
  icon, 
  trend, 
  loading = false,
  testId 
}: AnalyticsCardProps) {
  const IconComponent = iconMap[icon];
  const iconColor = iconColorMap[icon];
  const iconBg = iconBgMap[icon];

  if (loading) {
    return (
      <Card className="p-6" data-testid={testId}>
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-28" />
      </Card>
    );
  }

  return (
    <Card className="p-6" data-testid={testId}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900" data-testid={`${testId}-value`}>
              {value}{suffix}
            </p>
          </div>
          <div className={`p-3 ${iconBg} rounded-lg`}>
            <IconComponent className={`${iconColor} text-xl`} />
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            {trend.type === 'increase' ? (
              <TrendingUp className="text-healthcare-green text-xs mr-1" />
            ) : (
              <TrendingDown className="text-red-500 text-xs mr-1" />
            )}
            <span className={`font-medium ${
              trend.type === 'increase' ? 'text-healthcare-green' : 'text-red-500'
            }`}>
              {trend.type === 'increase' ? '+' : ''}{trend.value}{trend.suffix || ''}
            </span>
            <span className="text-slate-500 ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
