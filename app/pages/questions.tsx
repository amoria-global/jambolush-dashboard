//app/pages/questions-redesigned.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '../api/apiService';
import { useRouter } from 'next/navigation';
import { clearAssessmentCache } from '../utils/agentAssessmentGuard';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswers: number[];
  isMultipleSelect?: boolean;
}

interface Answer {
  questionId: string;
  selectedOptions: number[];
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: string;
}

interface AssessmentResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percentage: number;
  questionsResults: QuestionResult[];
}

interface QuestionResult {
  questionId: string;
  question: string;
  userAnswer: number[];
  correctAnswer: number[];
  isCorrect: boolean;
}

const AssessmentPage: React.FC = () => {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(4800); // 80 minutes
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Airbnb-inspired 40 questions
  const questions: Question[] = [
    {
      id: '1',
      question: 'What is the primary role of a field agent in property management?',
      options: [
        'Managing tenant complaints only',
        'Facilitating property viewings and client interactions',
        'Collecting rent payments',
        'Property maintenance and repairs'
      ],
      correctAnswers: [1],
    },
    {
      id: '2',
      question: 'Which of the following are essential qualities for a successful field agent? (Select all that apply)',
      options: [
        'Strong communication skills',
        'Punctuality and reliability',
        'Professional appearance',
        'Technical repair skills'
      ],
      correctAnswers: [0, 1, 2],
      isMultipleSelect: true
    },
    {
      id: '3',
      question: 'When conducting a property viewing, what should you prioritize?',
      options: [
        'Rushing through to save time',
        'Highlighting property features and answering client questions',
        'Discussing only the price',
        'Avoiding difficult questions'
      ],
      correctAnswers: [1],
    },
    {
      id: '4',
      question: 'How should you handle a difficult client during a property showing?',
      options: [
        'End the viewing immediately',
        'Remain calm, professional, and address their concerns',
        'Argue with them',
        'Ignore their complaints'
      ],
      correctAnswers: [1],
    },
    {
      id: '5',
      question: 'What documents should you verify before showing a property?',
      options: [
        'None required',
        'Client ID and appointment confirmation',
        'Only your own ID',
        'Property title deeds'
      ],
      correctAnswers: [1],
    },
    {
      id: '6',
      question: 'Which safety measures should field agents follow? (Select all that apply)',
      options: [
        'Meet clients in public first if uncertain',
        'Share location with office/team',
        'Verify client identity',
        'Go alone to remote locations'
      ],
      correctAnswers: [0, 1, 2],
      isMultipleSelect: true
    },
    {
      id: '7',
      question: 'What is the best way to follow up after a property viewing?',
      options: [
        'Wait for the client to contact you',
        'Send a thank you message and ask for feedback within 24 hours',
        'Never follow up',
        'Call them multiple times daily'
      ],
      correctAnswers: [1],
    },
    {
      id: '8',
      question: 'How should you present property amenities to potential clients?',
      options: [
        'Exaggerate to make the property more appealing',
        'Be honest and highlight genuine features',
        'Only mention negatives',
        'Avoid mentioning amenities'
      ],
      correctAnswers: [1],
    },
    {
      id: '9',
      question: 'What should you do if a property has visible defects during a viewing?',
      options: [
        'Hide or ignore them',
        'Honestly disclose them and explain any plans for repairs',
        'Blame the previous tenant',
        'Cancel the viewing'
      ],
      correctAnswers: [1],
    },
    {
      id: '10',
      question: 'Which tools are essential for a field agent? (Select all that apply)',
      options: [
        'Smartphone with camera',
        'Professional business cards',
        'Measurement tape',
        'Cooking equipment'
      ],
      correctAnswers: [0, 1, 2],
      isMultipleSelect: true
    },
    {
      id: '11',
      question: 'How do you handle multiple viewing appointments in one day?',
      options: [
        'Schedule them randomly',
        'Plan efficiently with buffer time between viewings',
        'Cancel some appointments',
        'Arrive late to all of them'
      ],
      correctAnswers: [1],
    },
    {
      id: '12',
      question: 'What information should you collect from interested clients?',
      options: [
        'Nothing',
        'Full name, contact details, and preferred move-in date',
        'Only their phone number',
        'Their entire financial history'
      ],
      correctAnswers: [1],
    },
    {
      id: '13',
      question: 'How should you dress for property viewings?',
      options: [
        'Casual streetwear',
        'Business casual or professional attire',
        'Gym clothes',
        'Whatever you feel like'
      ],
      correctAnswers: [1],
    },
    {
      id: '14',
      question: 'What should you do if you arrive at a property and it\'s not ready for viewing?',
      options: [
        'Show it anyway',
        'Contact the property owner and reschedule professionally',
        'Leave without informing anyone',
        'Clean it yourself'
      ],
      correctAnswers: [1],
    },
    {
      id: '15',
      question: 'Which communication skills are vital for field agents? (Select all that apply)',
      options: [
        'Active listening',
        'Clear and concise speaking',
        'Empathy and patience',
        'Using technical jargon only'
      ],
      correctAnswers: [0, 1, 2],
      isMultipleSelect: true
    },
    {
      id: '16',
      question: 'How do you build trust with potential tenants or buyers?',
      options: [
        'Make unrealistic promises',
        'Be transparent, honest, and reliable',
        'Pressure them to make quick decisions',
        'Avoid answering questions'
      ],
      correctAnswers: [1],
    },
    {
      id: '17',
      question: 'What should you do after confirming a booking or lease?',
      options: [
        'Stop all communication',
        'Provide all necessary documentation and stay available for questions',
        'Celebrate and forget the client',
        'Demand additional payment'
      ],
      correctAnswers: [1],
    },
    {
      id: '18',
      question: 'How should you handle pricing negotiations?',
      options: [
        'Accept any offer',
        'Reject all negotiations',
        'Communicate professionally with the property owner and client',
        'Set your own prices without consulting'
      ],
      correctAnswers: [2],
    },
    {
      id: '19',
      question: 'What are red flags to watch for in potential clients? (Select all that apply)',
      options: [
        'Reluctance to provide ID',
        'Requesting to skip official processes',
        'Aggressive or disrespectful behavior',
        'Asking detailed questions about the property'
      ],
      correctAnswers: [0, 1, 2],
      isMultipleSelect: true
    },
    {
      id: '20',
      question: 'How do you stay organized with multiple properties and clients?',
      options: [
        'Keep everything in your head',
        'Use a CRM or organized digital system',
        'Write on random papers',
        'Don\'t track anything'
      ],
      correctAnswers: [1],
    },
    {
      id: '21',
      question: 'What should you do if a client asks about neighborhood safety?',
      options: [
        'Make up information',
        'Provide honest, factual information or direct them to reliable resources',
        'Tell them it\'s unsafe to scare them away',
        'Refuse to answer'
      ],
      correctAnswers: [1],
    },
    {
      id: '22',
      question: 'How important is punctuality for property viewings?',
      options: [
        'Not important',
        'Very important - it shows professionalism and respect',
        'Only important for high-value properties',
        'Clients don\'t care about timing'
      ],
      correctAnswers: [1],
    },
    {
      id: '23',
      question: 'What should you include in property listing photos? (Select all that apply)',
      options: [
        'Well-lit, high-quality images',
        'Multiple angles of each room',
        'Exterior and key amenities',
        'Personal belongings and clutter'
      ],
      correctAnswers: [0, 1, 2],
      isMultipleSelect: true
    },
    {
      id: '24',
      question: 'How do you handle last-minute viewing cancellations?',
      options: [
        'Get angry at the client',
        'Confirm the cancellation professionally and offer to reschedule',
        'Show up anyway',
        'Block their number'
      ],
      correctAnswers: [1],
    },
    {
      id: '25',
      question: 'What is your responsibility regarding property security during viewings?',
      options: [
        'Leave doors unlocked',
        'Ensure all doors and windows are secured before leaving',
        'Let clients lock up',
        'Security is not your concern'
      ],
      correctAnswers: [1],
    },
    {
      id: '26',
      question: 'How should you respond to client feedback and reviews?',
      options: [
        'Ignore all feedback',
        'Respond professionally and use it to improve',
        'Argue with negative reviews',
        'Delete bad reviews'
      ],
      correctAnswers: [1],
    },
    {
      id: '27',
      question: 'What technology can enhance your work as a field agent? (Select all that apply)',
      options: [
        'Virtual tour apps',
        'Scheduling and calendar tools',
        'Digital contracts and e-signatures',
        'None, technology isn\'t helpful'
      ],
      correctAnswers: [0, 1, 2],
      isMultipleSelect: true
    },
    {
      id: '28',
      question: 'How do you handle competing offers on a property?',
      options: [
        'Choose your favorite client',
        'Present all offers to the owner and let them decide',
        'Accept the first offer only',
        'Ignore other offers'
      ],
      correctAnswers: [1],
    },
    {
      id: '29',
      question: 'What should you do if you suspect fraudulent activity from a client?',
      options: [
        'Ignore it',
        'Proceed with caution',
        'Report to your supervisor and stop the transaction',
        'Confront the client aggressively'
      ],
      correctAnswers: [2],
    },
    {
      id: '30',
      question: 'How do you maintain professionalism on social media?',
      options: [
        'Post personal drama',
        'Share professional content and engage respectfully',
        'Complain about clients',
        'Avoid social media entirely'
      ],
      correctAnswers: [1],
    },
    {
      id: '31',
      question: 'What are key aspects of effective time management? (Select all that apply)',
      options: [
        'Prioritizing urgent tasks',
        'Setting realistic schedules',
        'Avoiding procrastination',
        'Multitasking everything'
      ],
      correctAnswers: [0, 1, 2],
      isMultipleSelect: true
    },
    {
      id: '32',
      question: 'How do you handle confidential client information?',
      options: [
        'Share with friends',
        'Keep it secure and never disclose without permission',
        'Post on social media',
        'Sell to third parties'
      ],
      correctAnswers: [1],
    },
    {
      id: '33',
      question: 'What is the best approach when a client has a tight budget?',
      options: [
        'Refuse to help them',
        'Show properties within their range and suggest realistic options',
        'Push expensive properties anyway',
        'Ignore their budget concerns'
      ],
      correctAnswers: [1],
    },
    {
      id: '34',
      question: 'How do you ensure client satisfaction after move-in?',
      options: [
        'Never contact them again',
        'Check in periodically and address any concerns',
        'Only contact if they complain',
        'Assume everything is fine'
      ],
      correctAnswers: [1],
    },
    {
      id: '35',
      question: 'Which metrics indicate successful field agent performance? (Select all that apply)',
      options: [
        'Number of successful viewings',
        'Client satisfaction ratings',
        'Conversion rate (viewings to bookings)',
        'Number of complaints'
      ],
      correctAnswers: [0, 1, 2],
      isMultipleSelect: true
    },
    {
      id: '36',
      question: 'How do you handle language barriers with clients?',
      options: [
        'Refuse service',
        'Use translation tools or find an interpreter',
        'Speak louder',
        'Give up'
      ],
      correctAnswers: [1],
    },
    {
      id: '37',
      question: 'What should you do if a property owner asks you to hide issues?',
      options: [
        'Comply to keep them happy',
        'Refuse and maintain ethical standards',
        'Hide small issues only',
        'Charge extra for hiding issues'
      ],
      correctAnswers: [1],
    },
    {
      id: '38',
      question: 'How do you prepare for a property viewing?',
      options: [
        'Show up unprepared',
        'Research the property, prepare materials, and plan your route',
        'Just wing it',
        'Send someone else'
      ],
      correctAnswers: [1],
    },
    {
      id: '39',
      question: 'What are important aspects of customer service? (Select all that apply)',
      options: [
        'Responsiveness',
        'Professionalism',
        'Problem-solving ability',
        'Being pushy'
      ],
      correctAnswers: [0, 1, 2],
      isMultipleSelect: true
    },
    {
      id: '40',
      question: 'What is your approach to continuous professional development?',
      options: [
        'Stop learning after training',
        'Regularly update skills and stay informed about industry trends',
        'Only learn when forced',
        'Professional development is unnecessary'
      ],
      correctAnswers: [1],
    },
  ];

  // Get user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const authToken: any = localStorage.getItem('authToken');
        api.setAuth(authToken);
        const response = await api.get('auth/me');
        if (response.data) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  // Timer
  useEffect(() => {
    if (assessmentStarted && !showPreview && !showResults) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessmentStarted, showPreview, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (optionIndex: number) => {
    const question = questions[currentQuestion];
    const existingAnswer = answers.find(a => a.questionId === question.id);

    if (question.isMultipleSelect) {
      const currentSelections = existingAnswer?.selectedOptions || [];
      const newSelections = currentSelections.includes(optionIndex)
        ? currentSelections.filter(i => i !== optionIndex)
        : [...currentSelections, optionIndex];

      setAnswers(prev => {
        const filtered = prev.filter(a => a.questionId !== question.id);
        return [...filtered, { questionId: question.id, selectedOptions: newSelections }];
      });
    } else {
      setAnswers(prev => {
        const filtered = prev.filter(a => a.questionId !== question.id);
        return [...filtered, { questionId: question.id, selectedOptions: [optionIndex] }];
      });
    }
  };

  const isAnswered = (questionIndex: number) => {
    return answers.some(a => a.questionId === questions[questionIndex].id);
  };

  const getAnswerForQuestion = (questionId: string) => {
    return answers.find(a => a.questionId === questionId);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowPreview(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleGoToQuestion = (index: number) => {
    setCurrentQuestion(index);
    setShowPreview(false);
  };

  const handleAutoSubmit = () => {
    setShowPreview(true);
  };

  const calculateResults = (): AssessmentResult => {
    const questionsResults: QuestionResult[] = questions.map((question) => {
      const userAnswer = answers.find(a => a.questionId === question.id);
      const userSelectedOptions = userAnswer?.selectedOptions || [];

      const isCorrect =
        userSelectedOptions.length === question.correctAnswers.length &&
        userSelectedOptions.every(opt => question.correctAnswers.includes(opt));

      return {
        questionId: question.id,
        question: question.question,
        userAnswer: userSelectedOptions,
        correctAnswer: question.correctAnswers,
        isCorrect
      };
    });

    const correctAnswers = questionsResults.filter(r => r.isCorrect).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    return {
      totalQuestions,
      correctAnswers,
      score: correctAnswers,
      percentage,
      questionsResults
    };
  };

  const handleFinalSubmit = async () => {
    setIsSaving(true);
    try {
      const results = calculateResults();
      setAssessmentResult(results);

      // Transform and save to database
      const questionsAndAnswers = results.questionsResults.map((result) => ({
        questionId: parseInt(result.questionId),
        question: result.question,
        answer: result.userAnswer.map(i => questions.find(q => q.id === result.questionId)?.options[i]).join(', '),
        isCorrect: result.isCorrect
      }));

      await api.submitAssessment({ questionsAndAnswers });
      clearAssessmentCache();

      setSavedToDb(true);
      setShowResults(true);
      setShowPreview(false);

      // Redirect after 3 seconds
      setTimeout(() => {
        if (user?.userType === 'agent') {
          router.push('/all/agent');
        } else {
          router.push('/all/kyc');
        }
      }, 3000);

    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to save assessment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const answeredCount = answers.length;
  const progress = (answeredCount / questions.length) * 100;
  const currentAnswer = getAnswerForQuestion(questions[currentQuestion]?.id);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#083A85] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Start screen
  if (!assessmentStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#083A85] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#083A85]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Field Agent Assessment</h1>
              <p className="text-sm text-gray-600">Jambolush Property Management</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-[#083A85] bg-opacity-10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#083A85]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">40 Questions</p>
                  <p className="text-xs text-gray-600 mt-0.5">Multiple choice and multi-select questions</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-[#083A85] bg-opacity-10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#083A85]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">80 Minutes</p>
                  <p className="text-xs text-gray-600 mt-0.5">Complete the assessment before time runs out</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-[#083A85] bg-opacity-10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#083A85]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Review Before Submit</p>
                  <p className="text-xs text-gray-600 mt-0.5">You can review and edit answers before final submission</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setAssessmentStarted(true)}
              className="w-full bg-[#083A85] text-white py-3 px-6 rounded-xl font-medium hover:bg-[#062a60] transition-all shadow-sm hover:shadow-md text-sm"
            >
              Start Assessment
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Make sure you have a stable internet connection
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Preview screen
  if (showPreview && !showResults) {
    const unanswered = questions.filter((q, idx) => !isAnswered(idx));

    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Review Your Answers</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-2xl font-semibold text-green-900">{answeredCount}</p>
                <p className="text-xs text-green-700 mt-1">Answered</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <p className="text-2xl font-semibold text-orange-900">{unanswered.length}</p>
                <p className="text-xs text-orange-700 mt-1">Unanswered</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-2xl font-semibold text-blue-900">{Math.round(progress)}%</p>
                <p className="text-xs text-blue-700 mt-1">Complete</p>
              </div>
            </div>

            {unanswered.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      {unanswered.length} question{unanswered.length > 1 ? 's' : ''} unanswered
                    </p>
                    <p className="text-xs text-amber-700 mt-1">You can submit anyway or go back to answer them</p>
                  </div>
                </div>
              </div>
            )}

            {/* Question grid */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-6">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => handleGoToQuestion(idx)}
                  className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                    isAnswered(idx)
                      ? 'bg-green-100 text-green-900 border-2 border-green-300 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-3 px-6 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all text-sm"
              >
                Continue Editing
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSaving}
                className="flex-1 bg-[#083A85] text-white py-3 px-6 rounded-xl font-medium hover:bg-[#062a60] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm hover:shadow-md"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : 'Submit Assessment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults && assessmentResult) {
    const passed = assessmentResult.percentage >= 80;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                passed ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                {passed ? (
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {passed ? 'Congratulations!' : 'Assessment Complete'}
              </h2>
              <p className="text-sm text-gray-600">
                {passed
                  ? 'You have successfully passed the assessment'
                  : 'Thank you for completing the assessment'}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Score</span>
                <span className="text-lg font-semibold text-gray-900">
                  {assessmentResult.correctAnswers}/{assessmentResult.totalQuestions}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Percentage</span>
                <span className={`text-lg font-semibold ${passed ? 'text-green-600' : 'text-orange-600'}`}>
                  {assessmentResult.percentage}%
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  passed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {passed ? 'Passed' : 'Under Review'}
                </span>
              </div>
            </div>

            {passed && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-green-800">
                  {user?.userType === 'agent'
                    ? 'Redirecting to your dashboard...'
                    : 'Redirecting to complete your KYC verification...'}
                </p>
              </div>
            )}

            {savedToDb && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800">Assessment successfully saved</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Question screen
  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-500">Question {currentQuestion + 1} of {questions.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`font-medium ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-700'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#083A85] transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
              {question.question}
            </h2>
            {question.isMultipleSelect && (
              <p className="text-xs text-gray-500 mt-2">Select all that apply</p>
            )}
          </div>

          <div className="space-y-2">
            {question.options.map((option, idx) => {
              const isSelected = currentAnswer?.selectedOptions.includes(idx);

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-[#083A85] bg-[#083A85] bg-opacity-5'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'border-[#083A85] bg-[#083A85]'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            className="flex-1 bg-[#083A85] text-white py-2.5 px-6 rounded-xl font-medium hover:bg-[#062a60] transition-all text-sm shadow-sm"
          >
            {currentQuestion === questions.length - 1 ? 'Review Answers' : 'Next'}
          </button>

          <button
            onClick={() => setShowPreview(true)}
            className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm"
            title="Review all answers"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
        </div>

        {/* Question navigator */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-700 mb-3">Quick Navigation</p>
          <div className="grid grid-cols-10 gap-1.5">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                  idx === currentQuestion
                    ? 'bg-[#083A85] text-white'
                    : isAnswered(idx)
                    ? 'bg-green-100 text-green-900 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
