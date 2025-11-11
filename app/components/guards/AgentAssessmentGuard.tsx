// app/components/guards/AgentAssessmentGuard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { agentAssessmentGuard, cacheAssessmentStatus, getCachedAssessmentStatus } from '@/app/utils/agentAssessmentGuard';
import AssessmentModal from '../modals/AssessmentModal';

// FEATURE FLAG: Temporarily disable assessment check
// Set to true to enable assessment requirement, false to disable
const ENABLE_ASSESSMENT_CHECK = false;

interface AgentAssessmentGuardProps {
  children: React.ReactNode;
  showLoading?: boolean;
}

/**
 * Agent Assessment Guard Component
 *
 * This component checks if an agent user has submitted their assessment.
 * If they haven't, it shows a blocking modal forcing them to complete it.
 *
 * Usage:
 * ```tsx
 * <AgentAssessmentGuard>
 *   <YourProtectedContent />
 * </AgentAssessmentGuard>
 * ```
 */
const AgentAssessmentGuard: React.FC<AgentAssessmentGuardProps> = ({
  children,
  showLoading = true,
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [canAccess, setCanAccess] = useState(false);
  const [userType, setUserType] = useState<string>('');

  useEffect(() => {
    const checkAssessment = async () => {
      // If assessment check is disabled, allow access immediately
      if (!ENABLE_ASSESSMENT_CHECK) {
        console.log('Assessment check is disabled. Allowing access.');
        setCanAccess(true);
        setIsChecking(false);
        return;
      }

      try {
        // First, check cache for faster UX
        const cachedStatus = getCachedAssessmentStatus();

        if (cachedStatus && cachedStatus.hasSubmitted && cachedStatus.isPassed) {
          // Cache says assessment is submitted and passed, allow access
          setCanAccess(true);
          setIsChecking(false);
          return;
        }

        // No cache or cache says not submitted/failed, verify with API
        const { shouldRedirect, assessmentStatus, userIsAgent } = await agentAssessmentGuard();

        if (!userIsAgent) {
          // Not an agent, allow access
          setCanAccess(true);
          setIsChecking(false);
          return;
        }

        setUserType('agent');

        if (shouldRedirect) {
          // Agent hasn't submitted assessment or failed, show modal
          console.log('Agent has not passed assessment. Showing modal.');
          setShowModal(true);
          setCanAccess(false);
          setIsChecking(false);
          return;
        }

        // Agent has submitted assessment and passed, cache the status and allow access
        cacheAssessmentStatus(assessmentStatus);
        setCanAccess(true);
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking assessment status:', error);

        // On error, allow access (fail open)
        setCanAccess(true);
        setIsChecking(false);
      }
    };

    checkAssessment();
  }, []);

  // Show loading state while checking
  if (isChecking) {
    if (!showLoading) {
      return null;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // Show ONLY modal if assessment needed (block page content)
  if (showModal) {
    return <AssessmentModal isOpen={showModal} userType={userType} />;
  }

  // Only render children if access is granted
  return canAccess ? <>{children}</> : null;
};

export default AgentAssessmentGuard;
