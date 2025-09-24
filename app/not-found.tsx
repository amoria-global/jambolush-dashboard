"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const NotFound: React.FC = () => {
  const router = useRouter();

  const handleGoBack = () => {
    // Check if there's browser history to go back to
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // Fallback to home page if no history
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        {/* Bootstrap Icons CSS - Add this to your _app.tsx or layout */}
        <style jsx global>{`
          @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css');
        `}</style>

        {/* 404 Illustration */}
        <div className="relative mb-8" role="img" aria-label="404 Error Illustration">
          <div className="text-6xl sm:text-8xl font-bold text-transparent bg-gradient-to-r from-blue-900 to-pink-600 bg-clip-text">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full shadow-lg flex items-center justify-center transform animate-bounce">
              <i className="bi bi-geo-alt-fill text-xl sm:text-2xl text-pink-600" aria-hidden="true"></i>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-900">
            Page Not Found
          </h1>
          
          <p className="text-gray-600 text-sm sm:text-base">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6">
            <button
              className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
              onClick={handleGoBack}
              aria-label="Go back to previous page"
            >
              <i className="bi bi-arrow-left" aria-hidden="true"></i>
              Go Back
            </button>
            
            <Link 
              href="/"
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              aria-label="Go to home page"
            >
              <i className="bi bi-house-fill" aria-hidden="true"></i>
              Home
            </Link>
          </div>

          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-500 mb-3">
              Need help finding what you're looking for?
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm">
              <Link 
                href="/contact" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Contact Support
              </Link>
              <Link 
                href="/sitemap" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Site Map
              </Link>
              <Link 
                href="/search" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Search
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotFound;