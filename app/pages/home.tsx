"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/api/apiService";

interface User {
  userType: "host" | "tourguide" | "guest" | "agent";
  // other user properties
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUserAndRedirect = async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          router.push("https://jambolush.com/all/login");
          return;
        }

        // set token for future API calls
        api.setAuth(token);

        // fetch logged in user
        const { data: user } = await api.get<User>("/auth/me");

        if (user?.userType) {
          router.push(`/all/${user.userType}`);
        } else {
          router.push("https://jambolush.com/all/login");
        }
      } catch (error) {
        router.push("https://jambolush.com/all/login");
      } finally {
        setIsLoading(false);
      }
    };

    getUserAndRedirect();
  }, [router]);

  if (isLoading) {
    return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Redirecting to your dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-600 mb-4">
          Redirecting...
        </h1>
        <p className="text-gray-500">
          If you are not redirected automatically, please try refreshing the page.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
