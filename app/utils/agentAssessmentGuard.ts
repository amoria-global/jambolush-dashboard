// app/utils/agentAssessmentGuard.ts
/**
 * Agent Assessment Guard Utility
 *
 * Ensures that agent users have completed their assessments before
 * accessing the system. This guard should be used in the agent dashboard
 * and other agent-specific routes.
 */

import api from '../api/apiService';

export interface AssessmentStatus {
  hasSubmitted: boolean;
  isPassed?: boolean;
  submittedAt?: string;
  score?: number;
  percentage?: number;
  assessmentId?: string;
  status?: string;
  correctAnswers?: number;
  totalQuestions?: number;
}

/**
 * Check if the current user is an agent
 * @returns boolean indicating if user is an agent
 */
export const isAgent = async (): Promise<boolean> => {
  try {
    const response = await api.get('auth/me');
    if (response.data && response.data.userType) {
      return response.data.userType === 'agent';
    }
    return false;
  } catch (error) {
    console.error('Error checking user type:', error);
    return false;
  }
};

/**
 * Check if an agent has submitted their assessment
 * @returns AssessmentStatus object
 */
export const checkAssessmentStatus = async (): Promise<AssessmentStatus> => {
  try {
    const response = await api.getAssessmentStatus();

    if (response.ok && response.data && response.data.success) {
      const data = response.data.data;
      return {
        hasSubmitted: data.hasSubmitted || false,
        isPassed: data.isPassed,
        submittedAt: data.submittedAt,
        score: data.score,
        percentage: data.percentage || data.score, // Backend returns score, not percentage
        assessmentId: data.assessmentId,
        status: data.status,
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions,
      };
    }

    // Default to not submitted if API fails
    return { hasSubmitted: false, isPassed: false };
  } catch (error: any) {
    console.error('Error checking assessment status:', error);

    // If endpoint returns 404 or doesn't exist, assume no assessment submitted
    if (error.status === 404) {
      return { hasSubmitted: false, isPassed: false };
    }

    // For other errors, default to not submitted for safety
    return { hasSubmitted: false, isPassed: false };
  }
};

/**
 * Guard function to check if agent should be redirected to assessment
 * @returns Object with shouldRedirect boolean and assessment status
 */
export const agentAssessmentGuard = async (): Promise<{
  shouldRedirect: boolean;
  assessmentStatus: AssessmentStatus;
  userIsAgent: boolean;
}> => {
  try {
    // Check if user is an agent
    const userIsAgent = await isAgent();

    // If not an agent, no need to check assessment
    if (!userIsAgent) {
      return {
        shouldRedirect: false,
        assessmentStatus: { hasSubmitted: true, isPassed: true }, // Non-agents don't need assessments
        userIsAgent: false,
      };
    }

    // Check assessment status for agent users
    const assessmentStatus = await checkAssessmentStatus();

    // Agent should be redirected if they haven't submitted assessment OR if they failed
    // This allows agents to retake the assessment if they didn't pass (score < 80%)
    const shouldRedirect = !assessmentStatus.hasSubmitted || !assessmentStatus.isPassed;

    return {
      shouldRedirect,
      assessmentStatus,
      userIsAgent: true,
    };
  } catch (error) {
    console.error('Error in agent assessment guard:', error);

    // In case of error, don't redirect (fail open)
    return {
      shouldRedirect: false,
      assessmentStatus: { hasSubmitted: true, isPassed: true },
      userIsAgent: false,
    };
  }
};

/**
 * Local storage key for assessment status cache
 */
const ASSESSMENT_CACHE_KEY = 'agent_assessment_status';

/**
 * Cache assessment status in local storage
 * @param status Assessment status to cache
 */
export const cacheAssessmentStatus = (status: AssessmentStatus): void => {
  try {
    localStorage.setItem(ASSESSMENT_CACHE_KEY, JSON.stringify({
      ...status,
      cachedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error caching assessment status:', error);
  }
};

/**
 * Get cached assessment status from local storage
 * @returns Cached assessment status or null
 */
export const getCachedAssessmentStatus = (): AssessmentStatus | null => {
  try {
    const cached = localStorage.getItem(ASSESSMENT_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);

      // Cache expires after 1 hour
      const cachedAt = new Date(parsed.cachedAt);
      const now = new Date();
      const hoursSinceCached = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceCached < 1) {
        return {
          hasSubmitted: parsed.hasSubmitted,
          submittedAt: parsed.submittedAt,
          score: parsed.score,
          percentage: parsed.percentage,
          assessmentId: parsed.assessmentId,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting cached assessment status:', error);
    return null;
  }
};

/**
 * Clear assessment status cache
 */
export const clearAssessmentCache = (): void => {
  try {
    localStorage.removeItem(ASSESSMENT_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing assessment cache:', error);
  }
};
