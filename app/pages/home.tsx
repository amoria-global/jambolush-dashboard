"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HostPage from "../all/host/page";
import TourGuideDashboard from "./tourguide/dashboard";
import AgentDashboard from "./agent/dashboard";
import GuestDashboard from "./guest/dashboard";
import Dashboard from "./host/dashboard";


// Import your dashboard components


// Assuming you have these types defined
interface User {
  userType: 'host' | 'tourguide' | 'guest' | 'agent';
  // other user properties
}

interface UserSession {
  user?: User;
  token: string;
  role: string;
}

export default function HomePage() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get user session from your state management (context, redux, etc.)
    // This is a placeholder - replace with your actual session retrieval method
    const getUserSession = async () => {
      try {
        // Replace this with your actual method to get user session
        // For example: const session = await getStoredUserSession();
        // or from context: const session = useContext(AuthContext).userSession;
        
        const session = getUserSessionFromStorage(); // Your implementation
        
        if (session) {
          setUserSession(session);
        } else {
          // Redirect to login if no session
          //router.push('/login');
        }
      } catch (error) {
        console.error('Error getting user session:', error);
        //router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    getUserSession();
  }, [router]);

  // Show loading while checking session
  if (isLoading) {
    return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // If no user session, this shouldn't render (redirect happens in useEffect)
  if (!userSession) {
    return null;
  }

  // Get user type from user session
  const userType = userSession.role;

  // Render appropriate dashboard based on user type
  const renderDashboard = () => {
    switch (userType) {
      case 'host':
        return <Dashboard />;
      case 'tourguide':
        return <TourGuideDashboard />;
      case 'guest':
        return <GuestDashboard />;
      case 'agent':
        return <AgentDashboard />;
      default:
        return (
          <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                Invalid User Type
              </h1>
              <p className="text-gray-600">
                Your account type "{userType}" is not recognized.
              </p>
              <button 
                onClick={() => router.push('/login')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Return to Login
              </button>
            </div>
          </div>
        );
    }
  };

  return renderDashboard();
}

// Helper function to get user session from localStorage
function getUserSessionFromStorage(): UserSession | null {
  try {
    const sessionData = localStorage.getItem('userSession');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Error parsing user session from localStorage:', error);
    return null;
  }
}