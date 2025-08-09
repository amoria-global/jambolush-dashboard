import React, { useState, useEffect, FC } from 'react';
// Define the props interface for the ProgressStep component
interface ProgressStepProps {
  step: number;
  currentStep: number;
  icon: FC<any>; // FC is a functional component type, any for now since SVG props are simple
  title: string;
  description: string;
}

const AwaitingApprovalPage = () => {
  // State to simulate time elapsed, though not used for a specific visual effect in this version
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  // State to control which step in the progress bar is currently active
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    // Simulate a timer for demonstration purposes
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 100);

    // Simulate progress through the steps over a few seconds
    const stepTimer = setTimeout(() => {
      setCurrentStep(2);
    }, 2000);

    // Clean up the timers when the component unmounts to prevent memory leaks
    return () => {
      clearInterval(timer);
      clearTimeout(stepTimer);
    };
  }, []);

  // A component to display an animated icon with floating particles
  const AnimatedIcon = () => (
    <div className="relative">
      <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-600 shadow-lg transform transition-transform hover:scale-105">
        <div className="relative">
          {/* Clock icon SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 animate-pulse">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-ping"></div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full"></div>
        </div>
      </div>
      
      {/* Floating particles animation */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-300 rounded-full opacity-40 animate-bounce"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 20}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: '2s'
            }}
          ></div>
        ))}
      </div>
    </div>
  );

  // A component to render each step in the application progress
  const ProgressStep: FC<ProgressStepProps> = ({ step, currentStep, icon: Icon, title, description }) => (
    <div className={`flex items-start space-x-4 p-4 rounded-lg transition-all duration-500 ${
      step <= currentStep ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-gray-200'
    }`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
        step <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
      }`}>
        {/* Render the icon SVG directly */}
        {step < currentStep ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-8.66"/>
            <path d="M9 11l3 3L22 4"/>
          </svg>
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold transition-colors duration-300 ${
          step <= currentStep ? 'text-blue-900' : 'text-gray-600'
        }`}>
          {title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-8">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-10 border border-white/20">
            
            {/* Animated Icon */}
            <div className="relative">
              <AnimatedIcon />
            </div>

            {/* Main Heading with animation */}
            <div className="mb-6">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 animate-fade-in">
                Application Received
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
            </div>
            
            {/* Enhanced informative message */}
            <div className="mb-8">
              <p className="text-lg sm:text-xl text-gray-700 mb-4 max-w-2xl mx-auto leading-relaxed">
                Thank you for applying to be an agent with <span className="font-bold text-blue-600">Jambolush</span>. 
                Your account application is currently under review.
              </p>
              
              {/* Status indicator */}
              <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                Under Review
              </div>
            </div>
            
            {/* Enhanced next steps with progress tracking */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-inner border border-gray-100 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center">
                {/* Users icon SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 mr-2 text-blue-600">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Application Process
              </h2>
              
              <div className="space-y-4 text-left max-w-2xl mx-auto">
                <ProgressStep 
                  step={1}
                  currentStep={currentStep}
                  icon={() => (
                    // FileText icon SVG
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                      <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                      <path d="M10 9H8"/>
                      <path d="M16 13H8"/>
                      <path d="M16 17H8"/>
                    </svg>
                  )}
                  title="Application Submitted"
                  description="Your application and credentials have been received and are being processed."
                />
                
                <ProgressStep 
                  step={2}
                  currentStep={currentStep}
                  icon={() => (
                    // Users icon SVG
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  )}
                  title="Under Review"
                  description="Our team is reviewing your application and credentials (1-2 days)."
                />  
                <ProgressStep 
                  step={3}
                  currentStep={currentStep}
                  icon={() => (
                    // CheckCircle icon SVG
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-8.66"/>
                      <path d="M9 11l3 3L22 4"/>
                    </svg>
                  )}
                  title="Approval & Access"
                  description="You'll receive email notification and gain full access to your agent dashboard."
                />
              </div>
            </div>
            {/* Timeline estimate */}
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
                <h3 className="font-semibold text-blue-900 mb-2">Estimated Timeline</h3>
                <p className="text-blue-700 text-sm">
                  {/* Clock icon SVG */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 inline mr-1">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  1-2 days for review completion
                </p>
              </div>
            </div>
            {/* Enhanced contact support section */}
            <div className="space-y-4">
              <p className="text-gray-600">
                Questions about your application?
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="mailto:support@jambolush.com"
                  className="group inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-full shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                >
                  {/* Mail icon SVG */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 group-hover:animate-bounce">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  Contact Support
                </a>
                <div className="text-sm text-gray-500">
                  Reference ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">AG-{Date.now().toString().slice(-6)}</span>
                </div>
              </div>
            </div>
            {/* Footer with helpful info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                💡 Tip: Add support@jambolush.com to your contacts to ensure you receive our updates
                            </p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default AwaitingApprovalPage;
