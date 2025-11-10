// app/components/modals/AssessmentModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/apiService';
import { useRouter } from 'next/navigation';
import { clearAssessmentCache } from '../../utils/agentAssessmentGuard';

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

interface AssessmentModalProps {
  isOpen: boolean;
  onClose?: () => void; // Optional - won't be used since it's blocking
  userType?: string;
}

const AssessmentModal: React.FC<AssessmentModalProps> = ({ isOpen, userType = 'agent' }) => {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(4800); // 80 minutes
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const questions: Question[] = [
    { id: '1', question: 'What is the primary role of a field agent in property management?', options: ['Managing tenant complaints only', 'Facilitating property viewings and client interactions', 'Collecting rent payments', 'Property maintenance and repairs'], correctAnswers: [1] },
    { id: '2', question: 'Which of the following are essential qualities for a successful field agent? (Select all that apply)', options: ['Strong communication skills', 'Punctuality and reliability', 'Professional appearance', 'Technical repair skills'], correctAnswers: [0, 1, 2], isMultipleSelect: true },
    { id: '3', question: 'When conducting a property viewing, what should you prioritize?', options: ['Rushing through to save time', 'Highlighting property features and answering client questions', 'Discussing only the price', 'Avoiding difficult questions'], correctAnswers: [1] },
    { id: '4', question: 'How should you handle a difficult client during a property showing?', options: ['End the viewing immediately', 'Remain calm, professional, and address their concerns', 'Argue with them', 'Ignore their complaints'], correctAnswers: [1] },
    { id: '5', question: 'What documents should you verify before showing a property?', options: ['None required', 'Client ID and appointment confirmation', 'Only your own ID', 'Property title deeds'], correctAnswers: [1] },
    { id: '6', question: 'Which safety measures should field agents follow? (Select all that apply)', options: ['Meet clients in public first if uncertain', 'Share location with office/team', 'Verify client identity', 'Go alone to remote locations'], correctAnswers: [0, 1, 2], isMultipleSelect: true },
    { id: '7', question: 'What is the best way to follow up after a property viewing?', options: ['Wait for the client to contact you', 'Send a thank you message and ask for feedback within 24 hours', 'Never follow up', 'Call them multiple times daily'], correctAnswers: [1] },
    { id: '8', question: 'How should you present property amenities to potential clients?', options: ['Exaggerate to make the property more appealing', 'Be honest and highlight genuine features', 'Only mention negatives', 'Avoid mentioning amenities'], correctAnswers: [1] },
    { id: '9', question: 'What should you do if a property has visible defects during a viewing?', options: ['Hide or ignore them', 'Honestly disclose them and explain any plans for repairs', 'Blame the previous tenant', 'Cancel the viewing'], correctAnswers: [1] },
    { id: '10', question: 'Which tools are essential for a field agent? (Select all that apply)', options: ['Smartphone with camera', 'Professional business cards', 'Measurement tape', 'Cooking equipment'], correctAnswers: [0, 1, 2], isMultipleSelect: true },
    { id: '11', question: 'How do you handle multiple viewing appointments in one day?', options: ['Schedule them randomly', 'Plan efficiently with buffer time between viewings', 'Cancel some appointments', 'Arrive late to all of them'], correctAnswers: [1] },
    { id: '12', question: 'What information should you collect from interested clients?', options: ['Nothing', 'Full name, contact details, and preferred move-in date', 'Only their phone number', 'Their entire financial history'], correctAnswers: [1] },
    { id: '13', question: 'How should you dress for property viewings?', options: ['Casual streetwear', 'Business casual or professional attire', 'Gym clothes', 'Whatever you feel like'], correctAnswers: [1] },
    { id: '14', question: 'What should you do if you arrive at a property and it\'s not ready for viewing?', options: ['Show it anyway', 'Contact the property owner and reschedule professionally', 'Leave without informing anyone', 'Clean it yourself'], correctAnswers: [1] },
    { id: '15', question: 'Which communication skills are vital for field agents? (Select all that apply)', options: ['Active listening', 'Clear and concise speaking', 'Empathy and patience', 'Using technical jargon only'], correctAnswers: [0, 1, 2], isMultipleSelect: true },
    { id: '16', question: 'How do you build trust with potential tenants or buyers?', options: ['Make unrealistic promises', 'Be transparent, honest, and reliable', 'Pressure them to make quick decisions', 'Avoid answering questions'], correctAnswers: [1] },
    { id: '17', question: 'What should you do after confirming a booking or lease?', options: ['Stop all communication', 'Provide all necessary documentation and stay available for questions', 'Celebrate and forget the client', 'Demand additional payment'], correctAnswers: [1] },
    { id: '18', question: 'How should you handle pricing negotiations?', options: ['Accept any offer', 'Reject all negotiations', 'Communicate professionally with the property owner and client', 'Set your own prices without consulting'], correctAnswers: [2] },
    { id: '19', question: 'What are red flags to watch for in potential clients? (Select all that apply)', options: ['Reluctance to provide ID', 'Requesting to skip official processes', 'Aggressive or disrespectful behavior', 'Asking detailed questions about the property'], correctAnswers: [0, 1, 2], isMultipleSelect: true },
    { id: '20', question: 'How do you stay organized with multiple properties and clients?', options: ['Keep everything in your head', 'Use a CRM or organized digital system', 'Write on random papers', 'Don\'t track anything'], correctAnswers: [1] },
    { id: '21', question: 'What should you do if a client asks about neighborhood safety?', options: ['Make up information', 'Provide honest, factual information or direct them to reliable resources', 'Tell them it\'s unsafe to scare them away', 'Refuse to answer'], correctAnswers: [1] },
    { id: '22', question: 'How important is punctuality for property viewings?', options: ['Not important', 'Very important - it shows professionalism and respect', 'Only important for high-value properties', 'Clients don\'t care about timing'], correctAnswers: [1] },
    { id: '23', question: 'What should you include in property listing photos? (Select all that apply)', options: ['Well-lit, high-quality images', 'Multiple angles of each room', 'Exterior and key amenities', 'Personal belongings and clutter'], correctAnswers: [0, 1, 2], isMultipleSelect: true },
    { id: '24', question: 'How do you handle last-minute viewing cancellations?', options: ['Get angry at the client', 'Confirm the cancellation professionally and offer to reschedule', 'Show up anyway', 'Block their number'], correctAnswers: [1] },
    { id: '25', question: 'What is your responsibility regarding property security during viewings?', options: ['Leave doors unlocked', 'Ensure all doors and windows are secured before leaving', 'Let clients lock up', 'Security is not your concern'], correctAnswers: [1] },
    { id: '26', question: 'How should you respond to client feedback and reviews?', options: ['Ignore all feedback', 'Respond professionally and use it to improve', 'Argue with negative reviews', 'Delete bad reviews'], correctAnswers: [1] },
    { id: '27', question: 'What technology can enhance your work as a field agent? (Select all that apply)', options: ['Virtual tour apps', 'Scheduling and calendar tools', 'Digital contracts and e-signatures', 'None, technology isn\'t helpful'], correctAnswers: [0, 1, 2], isMultipleSelect: true },
    { id: '28', question: 'How do you handle competing offers on a property?', options: ['Choose your favorite client', 'Present all offers to the owner and let them decide', 'Accept the first offer only', 'Ignore other offers'], correctAnswers: [1] },
    { id: '29', question: 'What should you do if you suspect fraudulent activity from a client?', options: ['Ignore it', 'Proceed with caution', 'Report to your supervisor and stop the transaction', 'Confront the client aggressively'], correctAnswers: [2] },
    { id: '30', question: 'How do you maintain professionalism on social media?', options: ['Post personal drama', 'Share professional content and engage respectfully', 'Complain about clients', 'Avoid social media entirely'], correctAnswers: [1] },
    { id: '31', question: 'What are key aspects of effective time management? (Select all that apply)', options: ['Prioritizing urgent tasks', 'Setting realistic schedules', 'Avoiding procrastination', 'Multitasking everything'], correctAnswers: [0, 1, 2], isMultipleSelect: true },
    { id: '32', question: 'How do you handle confidential client information?', options: ['Share with friends', 'Keep it secure and never disclose without permission', 'Post on social media', 'Sell to third parties'], correctAnswers: [1] },
    { id: '33', question: 'What is the best approach when a client has a tight budget?', options: ['Refuse to help them', 'Show properties within their range and suggest realistic options', 'Push expensive properties anyway', 'Ignore their budget concerns'], correctAnswers: [1] },
    { id: '34', question: 'How do you ensure client satisfaction after move-in?', options: ['Never contact them again', 'Check in periodically and address any concerns', 'Only contact if they complain', 'Assume everything is fine'], correctAnswers: [1] },
    { id: '35', question: 'Which metrics indicate successful field agent performance? (Select all that apply)', options: ['Number of successful viewings', 'Client satisfaction ratings', 'Conversion rate (viewings to bookings)', 'Number of complaints'], correctAnswers: [0, 1, 2], isMultipleSelect: true },
    { id: '36', question: 'How do you handle language barriers with clients?', options: ['Refuse service', 'Use translation tools or find an interpreter', 'Speak louder', 'Give up'], correctAnswers: [1] },
    { id: '37', question: 'What should you do if a property owner asks you to hide issues?', options: ['Comply to keep them happy', 'Refuse and maintain ethical standards', 'Hide small issues only', 'Charge extra for hiding issues'], correctAnswers: [1] },
    { id: '38', question: 'How do you prepare for a property viewing?', options: ['Show up unprepared', 'Research the property, prepare materials, and plan your route', 'Just wing it', 'Send someone else'], correctAnswers: [1] },
    { id: '39', question: 'What are important aspects of customer service? (Select all that apply)', options: ['Responsiveness', 'Professionalism', 'Problem-solving ability', 'Being pushy'], correctAnswers: [0, 1, 2], isMultipleSelect: true },
    { id: '40', question: 'What is your approach to continuous professional development?', options: ['Stop learning after training', 'Regularly update skills and stay informed about industry trends', 'Only learn when forced', 'Professional development is unnecessary'], correctAnswers: [1] },
  ];

  // Timer
  useEffect(() => {
    if (assessmentStarted && !showPreview && !showResults) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            setShowPreview(true);
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

  // Prevent closing/navigating away
  useEffect(() => {
    if (isOpen && !savedToDb) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isOpen, savedToDb]);

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

  const calculateResults = () => {
    let correctCount = 0;
    const questionsResults = questions.map((question) => {
      const userAnswer = answers.find(a => a.questionId === question.id);
      const userSelectedOptions = userAnswer?.selectedOptions || [];

      const isCorrect =
        userSelectedOptions.length === question.correctAnswers.length &&
        userSelectedOptions.every(opt => question.correctAnswers.includes(opt));

      if (isCorrect) correctCount++;

      return {
        questionId: parseInt(question.id),
        question: question.question,
        answer: userSelectedOptions.map(i => question.options[i]).join(', ') || 'No answer',
        isCorrect
      };
    });

    return { questionsResults, correctCount };
  };

  const handleFinalSubmit = async () => {
    setIsSaving(true);
    try {
      const { questionsResults, correctCount } = calculateResults();
      const calculatedPercentage = Math.round((correctCount / questions.length) * 100);

      // Submit to backend with exact format expected
      await api.submitAssessment({ questionsAndAnswers: questionsResults });

      clearAssessmentCache();
      setSavedToDb(true);
      setScore(correctCount);
      setPercentage(calculatedPercentage);
      setShowResults(true);
      setShowPreview(false);

      // Redirect after 3 seconds if passed
      if (calculatedPercentage >= 80) {
        setTimeout(() => {
          if (userType === 'agent') {
            router.push('/all/agent');
          } else {
            router.push('/all/kyc');
          }
          window.location.reload(); // Ensure guard re-checks
        }, 3000);
      }

    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to save assessment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const answeredCount = answers.length;
  const progress = (answeredCount / questions.length) * 100;
  const currentAnswer = getAnswerForQuestion(questions[currentQuestion]?.id);

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">

        {/* Start screen */}
        {!assessmentStarted && (
          <div className="p-10 overflow-y-auto">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-[#083A85] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#083A85]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-3">Required: Field Agent Assessment</h1>
              <p className="text-base text-gray-600">Complete this assessment to access the system</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-base font-medium text-amber-900">Assessment Required</p>
                  <p className="text-sm text-amber-700 mt-1">You must complete and pass this assessment before accessing agent features</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-[#083A85] bg-opacity-10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[#083A85]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900">40 Questions</p>
                  <p className="text-sm text-gray-600 mt-1">Multiple choice and multi-select</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-[#083A85] bg-opacity-10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[#083A85]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900">80 Minutes</p>
                  <p className="text-sm text-gray-600 mt-1">Complete before time expires</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-[#083A85] bg-opacity-10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[#083A85]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900">80% to Pass</p>
                  <p className="text-sm text-gray-600 mt-1">Review before final submit</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setAssessmentStarted(true)}
              className="w-full bg-[#083A85] text-white py-4 px-8 rounded-xl font-semibold hover:bg-[#062a60] transition-all shadow-sm hover:shadow-md text-base"
            >
              Start Assessment
            </button>
          </div>
        )}

        {/* Preview screen */}
        {showPreview && !showResults && (
          <div className="p-8 overflow-y-auto flex-1">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Review Your Answers</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                <p className="text-3xl font-semibold text-green-900">{answeredCount}</p>
                <p className="text-sm text-green-700 mt-2">Answered</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                <p className="text-3xl font-semibold text-orange-900">{questions.length - answeredCount}</p>
                <p className="text-sm text-orange-700 mt-2">Unanswered</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <p className="text-3xl font-semibold text-blue-900">{Math.round(progress)}%</p>
                <p className="text-sm text-blue-700 mt-2">Complete</p>
              </div>
            </div>

            {answeredCount < questions.length && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
                <p className="text-base font-medium text-amber-900">
                  {questions.length - answeredCount} question{questions.length - answeredCount > 1 ? 's' : ''} unanswered
                </p>
                <p className="text-sm text-amber-700 mt-2">You can submit anyway or go back</p>
              </div>
            )}

            <div className="grid grid-cols-8 gap-3 mb-8">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => { setCurrentQuestion(idx); setShowPreview(false); }}
                  className={`aspect-square rounded-lg text-base font-medium transition-all ${
                    isAnswered(idx)
                      ? 'bg-green-100 text-green-900 border-2 border-green-300 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-3 px-6 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-base"
              >
                Continue Editing
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSaving}
                className="flex-1 bg-[#083A85] text-white py-3 px-8 rounded-xl font-semibold hover:bg-[#062a60] transition-all disabled:opacity-50 text-base shadow-sm"
              >
                {isSaving ? 'Submitting...' : 'Submit Assessment'}
              </button>
            </div>
          </div>
        )}

        {/* Results screen */}
        {showResults && (
          <div className="p-10 overflow-y-auto">
            <div className="text-center mb-10">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                percentage >= 80 ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                {percentage >= 80 ? (
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              <h2 className="text-3xl font-semibold text-gray-900 mb-3">
                {percentage >= 80 ? 'Congratulations!' : 'Assessment Complete'}
              </h2>
              <p className="text-base text-gray-600">
                {percentage >= 80
                  ? 'You have successfully passed!'
                  : 'Please retake the assessment'}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl">
                <span className="text-base text-gray-600">Score</span>
                <span className="text-xl font-semibold text-gray-900">{score}/{questions.length}</span>
              </div>

              <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl">
                <span className="text-base text-gray-600">Percentage</span>
                <span className={`text-xl font-semibold ${percentage >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                  {percentage}%
                </span>
              </div>

              <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl">
                <span className="text-base text-gray-600">Status</span>
                <span className={`text-base font-semibold px-4 py-2 rounded-full ${
                  percentage >= 80 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {percentage >= 80 ? 'Passed' : 'Failed'}
                </span>
              </div>
            </div>

            {percentage >= 80 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <p className="text-base text-green-800">
                  {userType === 'agent'
                    ? 'Redirecting to your dashboard...'
                    : 'Redirecting to KYC...'}
                </p>
              </div>
            )}

            {percentage < 80 && (
              <button
                onClick={() => {
                  setShowResults(false);
                  setShowPreview(false);
                  setAssessmentStarted(false);
                  setAnswers([]);
                  setCurrentQuestion(0);
                  setTimeRemaining(4800);
                  setSavedToDb(false);
                }}
                className="w-full bg-[#083A85] text-white py-4 px-8 rounded-xl font-semibold hover:bg-[#062a60] transition-all text-base shadow-sm"
              >
                Retake Assessment
              </button>
            )}
          </div>
        )}

        {/* Question screen */}
        {assessmentStarted && !showPreview && !showResults && (
          <>
            <div className="bg-white border-b border-gray-200 px-8 py-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">Question {currentQuestion + 1} of {questions.length}</span>
                <div className="flex items-center gap-2 text-base">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`font-semibold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#083A85] transition-all duration-300 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 leading-relaxed">
                    {questions[currentQuestion].question}
                  </h2>
                  {questions[currentQuestion].isMultipleSelect && (
                    <p className="text-sm text-gray-500 mt-3">Select all that apply</p>
                  )}
                </div>

                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option, idx) => {
                    const isSelected = currentAnswer?.selectedOptions.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-[#083A85] bg-[#083A85] bg-opacity-5'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-[#083A85] bg-[#083A85]' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-base ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                            {option}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-8">
              <div className="flex gap-4 max-w-3xl mx-auto">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-40 text-base"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (currentQuestion < questions.length - 1) {
                      setCurrentQuestion(currentQuestion + 1);
                    } else {
                      setShowPreview(true);
                    }
                  }}
                  className="flex-1 bg-[#083A85] text-white py-3 px-8 rounded-xl font-semibold hover:bg-[#062a60] transition-all text-base shadow-sm"
                >
                  {currentQuestion === questions.length - 1 ? 'Review' : 'Next'}
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssessmentModal;
