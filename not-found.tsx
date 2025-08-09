'use client';

import React, { useEffect, useState } from 'react';

const NotFoundPage = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-gray-900 text-gray-100">
      {/* Ghost icon using Bootstrap Icon */}
      <div className={isMounted ? "animate-bounce" : ""}>
        <i className="bi bi-emoji-frown text-8xl text-gray-600 mb-6"></i>
      </div>

      <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-4">
        404
      </h1>

      <p className="text-lg md:text-2xl font-light text-gray-400 mb-8">
        Oops! The page you're looking for doesn't exist.
      </p>

      <a
        href="/"
        className="inline-flex items-center space-x-2 px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105 active:scale-95"
        aria-label="Go to Homepage"
      >
        <i className="bi bi-arrow-left"></i>
        <span>Go to Homepage</span>
      </a>
    </div>
  );
};

export default NotFoundPage;
