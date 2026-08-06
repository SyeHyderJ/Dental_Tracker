import { Smile, BarChart3, Bell, ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl space-y-12">
        {/* Logo and Tagline */}
        <div className="text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-indigo-600">
            <Smile className="h-5 w-5 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            SmileGuard
          </h2>
          <p className="mt-4 text-xl text-gray-500">
            Track your dental health with confidence
          </p>
        </div>

        {/* Feature Rows */}
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1 space-y-2 text-left">
              <h3 className="text-lg font-medium text-gray-900">Daily Tracking</h3>
              <p className="text-sm text-gray-500">
                Log brushing, flossing, and rinsing to build healthy habits.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50">
              <Bell className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1 space-y-2 text-left">
              <h3 className="text-lg font-medium text-gray-900">Smart Reminders</h3>
              <p className="text-sm text-gray-500">
                Get personalized reminders for check-ups and treatments.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50">
              <ListChecks className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1 space-y-2 text-left">
              <h3 className="text-lg font-medium text-gray-900">Progress Reports</h3>
              <p className="text-sm text-gray-500">
                Visualize your oral health journey with easy-to-read charts.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate('/create-account')}
            className="w-full flex items-center justify-center px-4 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => navigate('/sign-in')}
            className="w-full flex items-center justify-center px-4 py-3 text-base font-medium text-indigo-600 bg-white border border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2 rounded-md"
          >
            Sign In
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          <p>
            By signing up, you agree to our
            <a href="#" className="underline">
              Terms of Service
            </a>
            and
            <a href="#" className="underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}