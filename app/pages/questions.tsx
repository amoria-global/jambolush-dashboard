'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Clock, AlertCircle, CheckCircle, User, Mail, Play, Send } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswers?: number[];
}

interface Answer {
  questionId: string;
  selectedOptions: number[];
}

const AssessmentPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(4800); // 80 minutes in seconds
  const [showTimeAlert, setShowTimeAlert] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Agent information
  const agentInfo = {
    name: "Muben Scammer",
    email: "muben.scammer@gmail.com"
  };

  // All 40 questions
  const questions: Question[] = [
    {
      id: "Q1",
      question: "You arrive at a property for inspection and realize the GPS location provided is off by 2 km. How do you handle the situation?",
      options: [
        "Call the host immediately and ask for verbal directions.",
        "Abandon the inspection and reschedule.",
        "Use a mapping app to locate nearby landmarks and confirm with the host.",
        "Ask a passerby for directions without verifying with the host."
      ]
    },
    {
      id: "Q2",
      question: "A host offers you $50 to approve their property faster. What's your response?",
      options: [
        "Accept and approve it immediately.",
        "Decline politely and report to the platform.",
        "Take the money but delay the approval.",
        "Ignore the offer and proceed with the listing."
      ]
    },
    {
      id: "Q3",
      question: "A property owner calls their home 'luxury' but it's poorly maintained. What do you do?",
      options: [
        "Approve it without changes.",
        "Document the issues with photos and notes.",
        "Suggest repairs before marketing as 'luxury'.",
        "Change the listing title yourself without telling the owner."
      ]
    },
    {
      id: "Q4",
      question: "Two guests left opposite reviews for the same property. How do you decide which reflects reality?",
      options: [
        "Ask both guests for photos or proof.",
        "Remove both reviews.",
        "Keep only the positive review to protect the host.",
        "Automatically believe the first reviewer."
      ]
    },
    {
      id: "Q5",
      question: "If commission is 15% and the host wants $300 for 4 nights, what guest price should you list?",
      options: ["$345", "$300", "$315", "$350"]
    },
    {
      id: "Q6",
      question: "You have 4 inspections in 3 towns in one day, but one asks to reschedule urgently. What's your best move?",
      options: [
        "Cancel another inspection to fit them in.",
        "Rearrange stops based on distance and urgency.",
        "Ignore their request and keep your schedule.",
        "Postpone all inspections to another day."
      ]
    },
    {
      id: "Q7",
      question: "To attract digital nomads, which feature is most important to add?",
      options: [
        "24-hour check-in.",
        "Strong and reliable Wi-Fi.",
        "Large parking space.",
        "Garden seating area."
      ]
    },
    {
      id: "Q8",
      question: "A host has great photos but refuses on-site verification. What do you do?",
      options: [
        "List them anyway.",
        "Mark listing 'pending verification' and keep promoting.",
        "Decline listing until verification is done.",
        "Use their photos without telling them."
      ]
    },
    {
      id: "Q9",
      question: "A property is 80% booked by a competitor. How would you still convince the owner to list with Jambolush?",
      options: [
        "Offer unrealistic earnings projections.",
        "Highlight global reach and additional bookings potential.",
        "Insist on removing them from the competitor before joining.",
        "Ignore their current bookings."
      ]
    },
    {
      id: "Q10",
      question: "What 3 key details would attract an international traveler to a rural homestay over a city hotel?",
      options: [
        "Local culture, unique experiences, lower price.",
        "Basic amenities, strict rules, remote location.",
        "Poor transport, high price, privacy.",
        "Limited food, shared bathrooms, low security."
      ]
    },
    {
      id: "Q11",
      question: "A local festival is expected to bring 1,000 visitors. What's your plan to benefit Jambolush?",
      options: [
        "Do nothing; the market will adjust.",
        "Pre-onboard nearby properties and promote festival packages.",
        "Increase commission rates temporarily.",
        "Block bookings during the event."
      ]
    },
    {
      id: "Q12",
      question: "A host says, 'Your commission is too high.' How do you respond?",
      options: [
        "Explain marketing value and higher booking potential.",
        "Compare to less reputable platforms.",
        "Offer unapproved discounts.",
        "Tell them all competitors charge more."
      ]
    },
    {
      id: "Q13",
      question: "If bookings drop 25% in your area, what could be a cause?",
      options: [
        "Seasonal changes, economic downturn, increased competition.",
        "Host mood swings, random chance, inflation only.",
        "Weather, but nothing else matters.",
        "Always guest fault."
      ]
    },
    {
      id: "Q14",
      question: "What low-cost marketing tactic can bring 10 new hosts in a month?",
      options: [
        "Community presentations and local partnerships.",
        "Expensive TV ads only.",
        "Waiting for hosts to find the website.",
        "Sending flyers without follow-up."
      ]
    },
    {
      id: "Q15",
      question: "A luxury property owner wants no nearby competition. How do you respond?",
      options: [
        "Explain fairness policy and focus on their unique value.",
        "Agree and block other listings.",
        "Ignore request and list anyway without telling.",
        "Offer secret deals."
      ]
    },
    {
      id: "Q16",
      question: "Describe a time you worked without immediate reward. Why?",
      options: [
        "Because I believed in the long-term outcome.",
        "Because I was forced.",
        "I never work without immediate pay.",
        "Only for friends."
      ]
    },
    {
      id: "Q17",
      question: "If given easy and difficult leads, which do you choose first?",
      options: [
        "Difficult — shows skill and earns trust.",
        "Easy — quick win.",
        "Ignore both.",
        "Let others decide."
      ]
    },
    {
      id: "Q18",
      question: "Zero commission month — what do you do?",
      options: [
        "Quit immediately.",
        "Stay motivated and work on leads.",
        "Complain to management.",
        "Take a break from work."
      ]
    },
    {
      id: "Q19",
      question: "What sacrifice are you willing to make to hit targets?",
      options: [
        "Extra hours and weekend work.",
        "Cutting corners.",
        "Ignoring ethics.",
        "None."
      ]
    },
    {
      id: "Q20",
      question: "As CEO for a day, what's your move to boost agents?",
      options: [
        "Introduce performance bonuses.",
        "Fire half the team.",
        "Cut training budget.",
        "Reduce commission rates only."
      ]
    },
    {
      id: "Q21",
      question: "A property owner distrusts online platforms. How do you pitch Jambolush?",
      options: [
        "Focus on trust, visibility, and guest screening.",
        "Say everyone else is online.",
        "Avoid the conversation.",
        "Force them to sign."
      ]
    },
    {
      id: "Q22",
      question: "Host claims non-payment but records show payment sent. What do you do?",
      options: [
        "Provide proof and assist with bank follow-up.",
        "Ignore complaint.",
        "Argue until they accept.",
        "Send payment twice."
      ]
    },
    {
      id: "Q23",
      question: "Explain policy to someone who never used internet:",
      options: [
        "Use simple language and examples.",
        "Read it fast.",
        "Send them a link only.",
        "Skip explanation."
      ]
    },
    {
      id: "Q24",
      question: "Neighbor says property is unsafe. What's your move?",
      options: [
        "Investigate discreetly and verify.",
        "Ignore.",
        "Blacklist immediately.",
        "Tell host without checking."
      ]
    },
    {
      id: "Q25",
      question: "Close a host deal in under 5 minutes — your approach?",
      options: [
        "Highlight benefits and act confident.",
        "Read entire T&C line by line.",
        "Ask them to decide later.",
        "Discuss personal stories only."
      ]
    },
    {
      id: "Q26",
      question: "Skeptical meeting audience — what do you do?",
      options: [
        "Engage with real success stories.",
        "Ignore them.",
        "End presentation early.",
        "Offer random discounts."
      ]
    },
    {
      id: "Q27",
      question: "Negative review going viral — your step?",
      options: [
        "Address issue publicly with solution.",
        "Delete all reviews.",
        "Ignore.",
        "Blame the guest."
      ]
    },
    {
      id: "Q28",
      question: "Two hosts argue in meeting — what's your action?",
      options: [
        "Calm both and refocus discussion.",
        "Leave room.",
        "Take sides.",
        "End meeting abruptly."
      ]
    },
    {
      id: "Q29",
      question: "Great location, no safety features — list it?",
      options: [
        "No, require upgrades first.",
        "Yes, waive requirements.",
        "Yes, but temporary pending fix.",
        "Blacklist property."
      ]
    },
    {
      id: "Q30",
      question: "Another agent poaching leads — your action?",
      options: [
        "Report professionally and protect leads.",
        "Ignore.",
        "Confront aggressively.",
        "Poach theirs back."
      ]
    },
    {
      id: "Q31",
      question: "Property used for illegal activities after listing — step?",
      options: [
        "Remove listing, report to authorities.",
        "Ignore to keep revenue.",
        "Warn host only.",
        "Reduce visibility."
      ]
    },
    {
      id: "Q32",
      question: "Host cancels last-minute — guest upset. Action?",
      options: [
        "Offer alternative and assist refund.",
        "Ignore.",
        "Blame guest.",
        "Blacklist host instantly."
      ]
    },
    {
      id: "Q33",
      question: "Host refuses contract but wants listing — do you?",
      options: [
        "No, require signed contract.",
        "Yes, verbal deal.",
        "Yes, skip paperwork.",
        "Yes, under fake profile."
      ]
    },
    {
      id: "Q34",
      question: "Competitor recruits in your area — counter move?",
      options: [
        "Highlight your platform's unique benefits.",
        "Ignore.",
        "Join competitor.",
        "Cut commission to zero."
      ]
    },
    {
      id: "Q35",
      question: "Upload property with bad internet — how?",
      options: [
        "Save offline and upload when connected.",
        "Cancel listing.",
        "Ask host to upload.",
        "Skip photos."
      ]
    },
    {
      id: "Q36",
      question: "No tripod for photos — solution?",
      options: [
        "Stabilize phone against solid object.",
        "Hold phone loosely.",
        "Use zoom only.",
        "Skip photography."
      ]
    },
    {
      id: "Q37",
      question: "No dimensions given — what's your method?",
      options: [
        "Measure manually with tape.",
        "Guess.",
        "Ask host without verifying.",
        "Leave blank."
      ]
    },
    {
      id: "Q38",
      question: "Verify host ID — process?",
      options: [
        "Check authenticity and match with person.",
        "Accept any photo.",
        "Ignore verification.",
        "Use expired ID."
      ]
    },
    {
      id: "Q39",
      question: "Social media caption for new listing:",
      options: [
        "Discover comfort and style at the heart of the city — book now!",
        "Cheap rooms here.",
        "Random emojis.",
        "Contact us maybe."
      ]
    },
    {
      id: "Q40",
      question: "Limited info from host — how to list?",
      options: [
        "Collect minimum required and schedule follow-up.",
        "Guess missing details.",
        "Publish incomplete listing.",
        "Skip verification."
      ]
    }
  ];
  
  const questionsPerPage = 3;
  const totalQuestionPages = Math.ceil(questions.length / questionsPerPage);
  const totalSteps = totalQuestionPages + 2; // Includes Welcome and Submit pages

  useEffect(() => {
    if (assessmentStarted && !assessmentCompleted && !timeExpired) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setTimeExpired(true);
            return 0;
          }

          if (prev === 3000 || prev === 1200) {
            setShowTimeAlert(true);
            if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
            alertTimeoutRef.current = setTimeout(() => setShowTimeAlert(false), 5000);
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [assessmentStarted, assessmentCompleted, timeExpired]);


  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        const isSelected = existing.selectedOptions.includes(optionIndex);
        return prev.map(a =>
          a.questionId === questionId
            ? {
              ...a,
              selectedOptions: isSelected
                ? a.selectedOptions.filter(i => i !== optionIndex)
                : [...a.selectedOptions, optionIndex]
            }
            : a
        );
      } else {
        return [...prev, { questionId, selectedOptions: [optionIndex] }];
      }
    });
  };

  const getQuestionsForPage = (pageIndex: number) => {
    const startIdx = pageIndex * questionsPerPage;
    const endIdx = Math.min(startIdx + questionsPerPage, questions.length);
    return questions.slice(startIdx, endIdx);
  };

  const isAnswerSelected = (questionId: string, optionIndex: number) => {
    const answer = answers.find(a => a.questionId === questionId);
    return answer ? answer.selectedOptions.includes(optionIndex) : false;
  };

  const isCurrentPageValid = () => {
    if (currentStep === 0 || currentStep === totalSteps - 1) return true;
    
    const pageQuestions = getQuestionsForPage(currentStep - 1);
    return pageQuestions.every(q =>
      answers.some(a => a.questionId === q.id && a.selectedOptions.length > 0)
    );
  };

  const handleNext = () => {
    if (currentStep === 0) {
      setAssessmentStarted(true);
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setAssessmentCompleted(true);
    console.log('Submitted answers:', answers);
  };

  if (timeExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Time's Up!</h2>
          <p className="text-gray-600 mb-8">
            Unfortunately, you've run out of time. Your progress has been saved.
          </p>
          <p className="text-sm text-gray-500">
            We will be in touch regarding the next steps.
          </p>
        </div>
      </div>
    );
  }

  if (assessmentCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Submitted!</h2>
          <p className="text-gray-600 mb-8">
            Thank you for completing the Jambolush Field Agent Assessment. Your responses are now under review.
          </p>
          <p className="text-sm text-gray-500">
            You will receive a response via message or call in the coming days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans flex flex-col">
      {showTimeAlert && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-amber-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-3" />
            <span className="font-semibold">Time Check: {formatTime(timeRemaining)} remaining</span>
          </div>
        </div>
      )}

      <header className="bg-gradient-to-br from-[#083A85] to-[#0a4499] px-4 sm:px-6 lg:px-8 py-6 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              JAMBOLUSH FIELD AGENT ASSESSMENT
            </h1>
            <p className="text-blue-100 mt-1">
              {currentStep === 0 ? 'Welcome to the Assessment' :
                currentStep === totalSteps - 1 ? 'Review & Submit' :
                  `Questions ${((currentStep - 1) * questionsPerPage) + 1}-${Math.min(currentStep * questionsPerPage, questions.length)} of ${questions.length}`}
            </p>
          </div>
          {assessmentStarted && !assessmentCompleted && (
            <div className={`flex items-center px-4 py-2 rounded-xl transition-colors duration-300 ${timeRemaining <= 1200 ? 'bg-red-500/90 animate-pulse' : 'bg-black/20'
              }`}>
              <Clock className="w-5 h-5 mr-2 text-white" />
              <span className="font-mono text-lg font-medium text-white">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </header>

      {currentStep > 0 && currentStep < totalSteps - 1 && (
        <div className="px-4 sm:px-6 lg:px-8 py-4 bg-slate-100 border-b border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="relative">
              <div className="h-2.5 bg-slate-200 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-[#083A85] to-[#0a4499] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep - 1) * questionsPerPage) / questions.length * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-600 font-medium mt-1.5 block text-right">
                Progress: {Math.round(((currentStep - 1) * questionsPerPage) / questions.length * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow w-full bg-white">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-12">
          {currentStep === 0 && (
            <div className="space-y-8">
              <div className="bg-blue-50 border-l-4 border-[#083A85] rounded-r-lg p-6">
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 text-[#083A85] mr-3" />
                  <span className="font-semibold text-slate-800">{agentInfo.name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-[#083A85] mr-3" />
                  <span className="font-bold text-slate-700">{agentInfo.email}</span>
                </div>
              </div>

              <div className="text-center py-8">
                <h2 className="text-4xl font-extrabold text-slate-800 mb-4">
                  Ready to Begin?
                </h2>
                <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
                  This assessment evaluates your skills for the Field Agent role. Please read the instructions carefully before you start.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-left max-w-lg mx-auto">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Key Instructions:</h3>
                  <ul className="space-y-3 text-slate-700">
                    {[
                      { text: `You have <strong>1 hour and 20 minutes</strong> to complete 40 questions.` },
                      { text: "Some questions may have multiple correct answers. Select all that apply." },
                      { text: "Time alerts will appear periodically to help you manage your time." },
                      { text: "The timer will turn red when <strong>20 minutes</strong> remain." },
                      { text: "Once started, the assessment cannot be paused. Ensure you are in a quiet environment." },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-amber-500 mr-3 mt-1 text-xl font-bold">•</span>
                        <span dangerouslySetInnerHTML={{ __html: item.text }} />
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={handleNext}
                  className="cursor-pointer inline-flex place-items-center px-10 py-4 bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white font-bold text-lg rounded-full hover:from-[#0a4499] hover:to-[#0c52b8] transition-all shadow-lg hover:shadow-2xl transform hover:scale-105"
                >
                  <Play className="w-6 h-6 mr-2" />
                  Start Assessment
                </button>
              </div>
            </div>
          )}

          {currentStep > 0 && currentStep < totalSteps - 1 && (
            <div className="space-y-10">
              {getQuestionsForPage(currentStep - 1).map((question, idx) => {
                const globalIdx = ((currentStep - 1) * questionsPerPage) + idx;
                return (
                  <div key={question.id}>
                    <div className="flex items-start mb-5">
                      <span className="flex-shrink-0 w-10 h-10 bg-blue-100 text-[#083A85] border-2 border-blue-200 rounded-full flex items-center justify-center text-lg font-bold">
                        {globalIdx + 1}
                      </span>
                      <p className="ml-4 text-lg text-slate-900 font-extrabold">
                        {question.question}
                      </p>
                    </div>

                    <div className="space-y-3 ml-14">
                      {question.options.map((option, optionIdx) => {
                        const isSelected = isAnswerSelected(question.id, optionIdx);
                        return (
                          <label
                            key={optionIdx}
                            className={`flex items-center p-4 rounded-xl transition-all duration-200 border-2 cursor-pointer ${isSelected
                              ? 'bg-blue-50 border-[#083A85] shadow-md'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleAnswerSelect(question.id, optionIdx)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mr-4 flex items-center justify-center ${isSelected ? 'border-[#083A85] bg-[#083A85]' : 'border-slate-400'}`}>
                                {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-slate-800 font-semibold">
                              {option}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {currentStep === totalSteps - 1 && (
            <div className="space-y-8">
              <div className="text-center py-8">
                <h2 className="text-3xl font-extrabold text-slate-800 mb-4">
                  Final Review
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                  You've reached the end. Please review your answers before submitting.
                </p>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center mb-3">
                    <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                    <span className="text-xl font-bold text-slate-800">
                      {answers.filter(a => a.selectedOptions.length > 0).length} of {questions.length} Questions Answered
                    </span>
                  </div>
                  <p className="font-medium text-slate-600">
                    Time remaining: {formatTime(timeRemaining)}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
                  <p className="text-slate-700">
                    By submitting, you confirm that these answers are your own work. Our team will review your assessment, and you will receive feedback within the next few business days.
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  className="cursor-pointer inline-flex items-center px-10 py-4 bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-lg rounded-full hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-2xl transform hover:scale-105"
                >
                  <Send className="w-6 h-6 mr-2" />
                  Submit Assessment
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-slate-100 border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-5 sticky bottom-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="cursor-pointer inline-flex items-center px-5 py-2.5 rounded-full font-semibold transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:hover:bg-slate-200"
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" />
            Previous
          </button>

          <div className="flex items-center space-x-2">
              {Array.from({ length: totalSteps }).map((_, stepIndex) => (
                  <div
                      key={stepIndex}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                          stepIndex === currentStep
                              ? 'w-8 bg-gradient-to-r from-[#083A85] to-[#0a4499]'
                              : stepIndex < currentStep
                              ? 'w-2.5 bg-[#083A85]'
                              : 'w-2.5 bg-slate-300'
                      }`}
                  />
              ))}
          </div>

          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={currentStep > 0 && !isCurrentPageValid()}
              className="cursor-pointer inline-flex items-center px-6 py-2.5 rounded-full font-semibold transition-all text-sm text-white bg-gradient-to-br from-[#083A85] to-[#0a4499] hover:from-[#0a4499] hover:to-[#0c52b8] shadow-md hover:shadow-lg disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {currentStep === 0 ? 'Start' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <div style={{ width: '106px' }} />
          )}
        </div>
      </footer>
    </div>
  );
};

export default AssessmentPage;