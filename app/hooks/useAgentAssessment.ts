// app/hooks/useAgentAssessment.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  agentAssessmentGuard,
  checkAssessmentStatus,
  isAgent,
  cacheAssessmentStatus,
  getCachedAssessmentStatus,
  clearAssessmentCache,
  AssessmentStatus,
} from '@/app/utils/agentAssessmentGuard';

interface UseAgentAssessmentReturn {
  isAgent: boolean;
  hasSubmittedAssessment: boolean;
  assessmentStatus: AssessmentStatus | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

/**
 * Custom hook to check agent assessment status
 *
 * Usage:
 * ```tsx
 * const { isAgent, hasSubmittedAssessment, isLoading } = useAgentAssessment();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (isAgent && !hasSubmittedAssessment) return <Navigate to="/assessment" />;
 * return <Dashboard />;
 * ```
 */
export const useAgentAssessment = (): UseAgentAssessmentReturn => {
  const [isAgentUser, setIsAgentUser] = useState(false);
  const [hasSubmittedAssessment, setHasSubmittedAssessment] = useState(false);
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAssessmentStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      const cached = getCachedAssessmentStatus();
      if (cached) {
        setAssessmentStatus(cached);
        setHasSubmittedAssessment(cached.hasSubmitted);

        // Still check user type
        const userIsAgent = await isAgent();
        setIsAgentUser(userIsAgent);
        setIsLoading(false);
        return;
      }

      // Fetch fresh data
      const { shouldRedirect, assessmentStatus: status, userIsAgent } = await agentAssessmentGuard();

      setIsAgentUser(userIsAgent);
      setAssessmentStatus(status);
      setHasSubmittedAssessment(status.hasSubmitted);

      // Cache the result
      if (status.hasSubmitted) {
        cacheAssessmentStatus(status);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching assessment status:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setIsLoading(false);

      // Fail open - assume submitted on error
      setHasSubmittedAssessment(true);
    }
  }, []);

  useEffect(() => {
    fetchAssessmentStatus();
  }, [fetchAssessmentStatus]);

  const clearCache = useCallback(() => {
    clearAssessmentCache();
  }, []);

  return {
    isAgent: isAgentUser,
    hasSubmittedAssessment,
    assessmentStatus,
    isLoading,
    error,
    refetch: fetchAssessmentStatus,
    clearCache,
  };
};
