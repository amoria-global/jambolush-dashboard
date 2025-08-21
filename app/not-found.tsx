"use client"
import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-8xl font-bold text-transparent bg-gradient-to-r from-blue-900 to-pink-600 bg-clip-text">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center transform animate-bounce">
              <i className="bi bi-geo-alt-fill text-2xl text-pink-600"></i>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-blue-900">
            Page Not Found
          </h1>
          
          <p className="text-gray-600">
            The page you're looking for doesn't exist.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mt-6">
            <button 
              className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
              onClick={() => window.history.back()}
            >
              <i className="bi bi-arrow-left"></i>
              Back
            </button>
            
            <button 
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
              onClick={() => window.location.href = '/'}
            >
              <i className="bi bi-house-fill"></i>
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;