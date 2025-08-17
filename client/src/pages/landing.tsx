import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, Users, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Clock className="text-primary text-2xl" />
              <h1 className="text-xl font-bold text-slate-900">CareTime</h1>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary hover:bg-blue-600"
              data-testid="button-login"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Healthcare Staff Time Tracking
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Streamline your healthcare facility's time management with location-based clock in/out 
            and comprehensive analytics for managers.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-blue-600 text-lg px-8 py-3"
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <Card className="text-center" data-testid="card-location-based">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-primary text-xl" />
              </div>
              <CardTitle className="text-lg">Location-Based</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                GPS perimeter validation ensures staff can only clock in when at the facility
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="card-real-time">
            <CardHeader>
              <div className="w-12 h-12 bg-healthcare-green/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="text-healthcare-green text-xl" />
              </div>
              <CardTitle className="text-lg">Real-Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor staff attendance and working hours in real-time with comprehensive analytics
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="card-manager-dashboard">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="text-blue-500 text-xl" />
              </div>
              <CardTitle className="text-lg">Manager Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive analytics and staff management tools for healthcare administrators
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="card-secure">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="text-purple-500 text-xl" />
              </div>
              <CardTitle className="text-lg">Secure & Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built with healthcare compliance in mind, ensuring data security and privacy
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 p-8 bg-white rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Ready to streamline your healthcare facility's time tracking?
          </h2>
          <p className="text-slate-600 mb-6">
            Join healthcare facilities that trust CareTime for accurate and efficient staff time management.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-blue-600"
            data-testid="button-sign-up"
          >
            Sign Up Now
          </Button>
        </div>
      </div>
    </div>
  );
}
