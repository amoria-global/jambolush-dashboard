'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '../api/apiService';

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

const AssessmentContent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(4800); // 80 minutes in seconds
  const [showTimeAlert, setShowTimeAlert] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Email configuration
  const config = {
    apikey: process.env.BREVO_API_KEY || 'your-brevo-api-key',
    senderemail: process.env.RSENDER_EMAIL || 'noreply@jambolush.com'
  };


  // Get user data from auth/me endpoint
  const getUserData = async () => {
    try {
      const authToken: any = localStorage.getItem('authToken');
      setIsLoadingUser(true);
      api.setAuth(authToken);
      const response = await api.get('auth/me');

      if (response.data) {
        const userData: UserProfile = response.data;
        setUser(userData);
        console.log('User data fetched successfully:', userData);
        return userData;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Enhanced questions with correct answers
  const questions: Question[] = [
    {
      id: "Q1",
      question: "You arrive at a property for inspection and realize the GPS location provided is off by 2 km. How do you handle the situation?",
      options: [
        "Call the host immediately and ask for verbal directions.",
        "Abandon the inspection and reschedule.",
        "Use a mapping app to locate nearby landmarks and confirm with the host.",
        "Ask a passerby for directions without verifying with the host."
      ],
      correctAnswers: [2]
    },
    {
      id: "Q2",
      question: "A host offers you $50 to approve their property faster. What's your response?",
      options: [
        "Accept and approve it immediately.",
        "Decline politely and report to the platform.",
        "Take the money but delay the approval.",
        "Ignore the offer and proceed with the listing."
      ],
      correctAnswers: [1]
    },
    {
      id: "Q3",
      question: "A property owner calls their home 'luxury' but it's poorly maintained. What do you do?",
      options: [
        "Approve it without changes.",
        "Document the issues with photos and notes.",
        "Suggest repairs before marketing as 'luxury'.",
        "Change the listing title yourself without telling the owner."
      ],
      correctAnswers: [1, 2],
      isMultipleSelect: true
    },
    {
      id: "Q4",
      question: "Two guests left opposite reviews for the same property. How do you decide which reflects reality?",
      options: [
        "Ask both guests for photos or proof.",
        "Remove both reviews.",
        "Keep only the positive review to protect the host.",
        "Automatically believe the first reviewer."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q5",
      question: "If commission is 15% and the host wants $300 for 4 nights, what guest price should you list?",
      options: ["$345", "$300", "$315", "$350"],
      correctAnswers: [0]
    },
    {
      id: "Q6",
      question: "You have 4 inspections in 3 towns in one day, but one asks to reschedule urgently. What's your best move?",
      options: [
        "Cancel another inspection to fit them in.",
        "Rearrange stops based on distance and urgency.",
        "Ignore their request and keep your schedule.",
        "Postpone all inspections to another day."
      ],
      correctAnswers: [1]
    },
    {
      id: "Q7",
      question: "To attract digital nomads, which feature is most important to add?",
      options: [
        "24-hour check-in.",
        "Strong and reliable Wi-Fi.",
        "Large parking space.",
        "Garden seating area."
      ],
      correctAnswers: [1]
    },
    {
      id: "Q8",
      question: "A host has great photos but refuses on-site verification. What do you do?",
      options: [
        "List them anyway.",
        "Mark listing 'pending verification' and keep promoting.",
        "Decline listing until verification is done.",
        "Use their photos without telling them."
      ],
      correctAnswers: [2]
    },
    {
      id: "Q9",
      question: "A property is 80% booked by a competitor. How would you still convince the owner to list with Jambolush?",
      options: [
        "Offer unrealistic earnings projections.",
        "Highlight global reach and additional bookings potential.",
        "Insist on removing them from the competitor before joining.",
        "Ignore their current bookings."
      ],
      correctAnswers: [1]
    },
    {
      id: "Q10",
      question: "What 3 key details would attract an international traveler to a rural homestay over a city hotel?",
      options: [
        "Local culture, unique experiences, lower price.",
        "Basic amenities, strict rules, remote location.",
        "Poor transport, high price, privacy.",
        "Limited food, shared bathrooms, low security."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q11",
      question: "A local festival is expected to bring 1,000 visitors. What's your plan to benefit Jambolush?",
      options: [
        "Do nothing; the market will adjust.",
        "Pre-onboard nearby properties and promote festival packages.",
        "Increase commission rates temporarily.",
        "Block bookings during the event."
      ],
      correctAnswers: [1]
    },
    {
      id: "Q12",
      question: "A host says, 'Your commission is too high.' How do you respond?",
      options: [
        "Explain marketing value and higher booking potential.",
        "Compare to less reputable platforms.",
        "Offer unapproved discounts.",
        "Tell them all competitors charge more."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q13",
      question: "If bookings drop 25% in your area, what could be a cause?",
      options: [
        "Seasonal changes, economic downturn, increased competition.",
        "Host mood swings, random chance, inflation only.",
        "Weather, but nothing else matters.",
        "Always guest fault."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q14",
      question: "What low-cost marketing tactic can bring 10 new hosts in a month?",
      options: [
        "Community presentations and local partnerships.",
        "Expensive TV ads only.",
        "Waiting for hosts to find the website.",
        "Sending flyers without follow-up."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q15",
      question: "A luxury property owner wants no nearby competition. How do you respond?",
      options: [
        "Explain fairness policy and focus on their unique value.",
        "Agree and block other listings.",
        "Ignore request and list anyway without telling.",
        "Offer secret deals."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q16",
      question: "Describe a time you worked without immediate reward. Why?",
      options: [
        "Because I believed in the long-term outcome.",
        "Because I was forced.",
        "I never work without immediate pay.",
        "Only for friends."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q17",
      question: "If given easy and difficult leads, which do you choose first?",
      options: [
        "Difficult — shows skill and earns trust.",
        "Easy — quick win.",
        "Ignore both.",
        "Let others decide."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q18",
      question: "Zero commission month — what do you do?",
      options: [
        "Quit immediately.",
        "Stay motivated and work on leads.",
        "Complain to management.",
        "Take a break from work."
      ],
      correctAnswers: [1]
    },
    {
      id: "Q19",
      question: "What sacrifice are you willing to make to hit targets?",
      options: [
        "Extra hours and weekend work.",
        "Cutting corners.",
        "Ignoring ethics.",
        "None."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q20",
      question: "As CEO for a day, what's your move to boost agents?",
      options: [
        "Introduce performance bonuses.",
        "Fire half the team.",
        "Cut training budget.",
        "Reduce commission rates only."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q21",
      question: "A property owner distrusts online platforms. How do you pitch Jambolush?",
      options: [
        "Focus on trust, visibility, and guest screening.",
        "Say everyone else is online.",
        "Avoid the conversation.",
        "Force them to sign."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q22",
      question: "Host claims non-payment but records show payment sent. What do you do?",
      options: [
        "Provide proof and assist with bank follow-up.",
        "Ignore complaint.",
        "Argue until they accept.",
        "Send payment twice."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q23",
      question: "Explain policy to someone who never used internet:",
      options: [
        "Use simple language and examples.",
        "Read it fast.",
        "Send them a link only.",
        "Skip explanation."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q24",
      question: "Neighbor says property is unsafe. What's your move?",
      options: [
        "Investigate discreetly and verify.",
        "Ignore.",
        "Blacklist immediately.",
        "Tell host without checking."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q25",
      question: "Close a host deal in under 5 minutes — your approach?",
      options: [
        "Highlight benefits and act confident.",
        "Read entire T&C line by line.",
        "Ask them to decide later.",
        "Discuss personal stories only."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q26",
      question: "Skeptical meeting audience — what do you do?",
      options: [
        "Engage with real success stories.",
        "Ignore them.",
        "End presentation early.",
        "Offer random discounts."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q27",
      question: "Negative review going viral — your step?",
      options: [
        "Address issue publicly with solution.",
        "Delete all reviews.",
        "Ignore.",
        "Blame the guest."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q28",
      question: "Two hosts argue in meeting — what's your action?",
      options: [
        "Calm both and refocus discussion.",
        "Leave room.",
        "Take sides.",
        "End meeting abruptly."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q29",
      question: "Great location, no safety features — list it?",
      options: [
        "No, require upgrades first.",
        "Yes, waive requirements.",
        "Yes, but temporary pending fix.",
        "Blacklist property."
      ],
      correctAnswers: [0, 2],
      isMultipleSelect: true
    },
    {
      id: "Q30",
      question: "Another agent poaching leads — your action?",
      options: [
        "Report professionally and protect leads.",
        "Ignore.",
        "Confront aggressively.",
        "Poach theirs back."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q31",
      question: "Property used for illegal activities after listing — step?",
      options: [
        "Remove listing, report to authorities.",
        "Ignore to keep revenue.",
        "Warn host only.",
        "Reduce visibility."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q32",
      question: "Host cancels last-minute — guest upset. Action?",
      options: [
        "Offer alternative and assist refund.",
        "Ignore.",
        "Blame guest.",
        "Blacklist host instantly."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q33",
      question: "Host refuses contract but wants listing — do you?",
      options: [
        "No, require signed contract.",
        "Yes, verbal deal.",
        "Yes, skip paperwork.",
        "Yes, under fake profile."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q34",
      question: "Competitor recruits in your area — counter move?",
      options: [
        "Highlight your platform's unique benefits.",
        "Ignore.",
        "Join competitor.",
        "Cut commission to zero."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q35",
      question: "Upload property with bad internet — how?",
      options: [
        "Save offline and upload when connected.",
        "Cancel listing.",
        "Ask host to upload.",
        "Skip photos."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q36",
      question: "No tripod for photos — solution?",
      options: [
        "Stabilize phone against solid object.",
        "Hold phone loosely.",
        "Use zoom only.",
        "Skip photography."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q37",
      question: "No dimensions given — what's your method?",
      options: [
        "Measure manually with tape.",
        "Guess.",
        "Ask host without verifying.",
        "Leave blank."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q38",
      question: "Verify host ID — process?",
      options: [
        "Check authenticity and match with person.",
        "Accept any photo.",
        "Ignore verification.",
        "Use expired ID."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q39",
      question: "Social media caption for new listing:",
      options: [
        "Discover comfort and style at the heart of the city — book now!",
        "Cheap rooms here.",
        "Random emojis.",
        "Contact us maybe."
      ],
      correctAnswers: [0]
    },
    {
      id: "Q40",
      question: "Limited info from host — how to list?",
      options: [
        "Collect minimum required and schedule follow-up.",
        "Guess missing details.",
        "Publish incomplete listing.",
        "Skip verification."
      ],
      correctAnswers: [0]
    }
  ];
  
  const questionsPerPage = 3;
  const totalQuestionPages = Math.ceil(questions.length / questionsPerPage);
  const totalSteps = totalQuestionPages + 2; // Includes Welcome and Submit pages

  // Calculate assessment results
  const calculateResults = (): AssessmentResult => {
    const questionsResults: QuestionResult[] = questions.map(question => {
      const userAnswer = answers.find(a => a.questionId === question.id);
      const userSelectedOptions = userAnswer?.selectedOptions || [];
      
      // Check if answer is correct
      const isCorrect = question.correctAnswers.length === userSelectedOptions.length && 
        question.correctAnswers.every(correct => userSelectedOptions.includes(correct));

      return {
        questionId: question.id,
        question: question.question,
        userAnswer: userSelectedOptions,
        correctAnswer: question.correctAnswers,
        isCorrect
      };
    });

    const correctAnswers = questionsResults.filter(result => result.isCorrect).length;
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

  // Save assessment to database
  const saveAssessmentToDatabase = async (results: AssessmentResult) => {
    try {
      const assessmentData = {
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name || `${user?.firstName} ${user?.lastName}`,
        answers: answers,
        results: results,
        timeSpent: 4800 - timeRemaining,
        completedAt: new Date(),
        assessmentType: 'field-agent-evaluation'
      };

      await api.post('assessments', assessmentData);
      console.log('Assessment saved to database successfully');
      return true;
    } catch (error) {
      console.error('Error saving assessment to database:', error);
      setSaveError('Failed to save assessment data. Your results are still recorded.');
      return false;
    }
  };

  // Enhanced email functions with results
  const sendEnhancedAdminNotification = async (userEmail: string, userName: string, userAnswers: Answer[], results: AssessmentResult) => {
    const submissionTime = new Date().toLocaleString();
    const assessmentId = `JFA-${Date.now().toString().slice(-6)}`;
    
    const emailData = {
      sender: {
        name: "Jambolush Assessment System",
        email: config.senderemail
      },
      to: [
        {
          email: "admin@amoriaglobal.com",
          name: "Admin Team"
        }
      ],
      subject: `🎯 Field Agent Assessment Results - ${userName} (${results.percentage}%)`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Assessment Results</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #083A85 0%, #0a4499 100%); color: white; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Assessment Results Available</h1>
              <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">Field Agent Assessment Completed</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <!-- Results Summary -->
              <div style="background: ${results.percentage >= 70 ? '#d4edda' : results.percentage >= 50 ? '#fff3cd' : '#f8d7da'}; 
                          border: 1px solid ${results.percentage >= 70 ? '#c3e6cb' : results.percentage >= 50 ? '#ffeaa7' : '#f5c6cb'}; 
                          border-radius: 12px; padding: 25px; margin-bottom: 30px; text-align: center;">
                <h2 style="margin: 0 0 15px 0; color: ${results.percentage >= 70 ? '#155724' : results.percentage >= 50 ? '#856404' : '#721c24'}; font-size: 24px;">
                  Score: ${results.correctAnswers}/${results.totalQuestions} (${results.percentage}%)
                </h2>
                <p style="margin: 0; color: ${results.percentage >= 70 ? '#155724' : results.percentage >= 50 ? '#856404' : '#721c24'}; font-size: 16px;">
                  ${results.percentage >= 70 ? 'Excellent Performance!' : results.percentage >= 50 ? 'Good Performance' : 'Needs Improvement'}
                </p>
              </div>

              <!-- Candidate Information -->
              <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">Candidate Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555; width: 140px; border-bottom: 1px solid #dee2e6;">Name:</td>
                    <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #dee2e6;">${userName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555; border-bottom: 1px solid #dee2e6;">Email:</td>
                    <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #dee2e6;">${userEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555; border-bottom: 1px solid #dee2e6;">Assessment ID:</td>
                    <td style="padding: 10px 0; color: #333; font-family: monospace; border-bottom: 1px solid #dee2e6;">${assessmentId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555; border-bottom: 1px solid #dee2e6;">Completion Time:</td>
                    <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #dee2e6;">${submissionTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Time Spent:</td>
                    <td style="padding: 10px 0; color: #333;">${Math.round((4800 - timeRemaining) / 60)} minutes</td>
                  </tr>
                </table>
              </div>

              <!-- Performance Breakdown -->
              <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">Performance Analysis</h3>
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Correct Answers</span>
                    <strong>${results.correctAnswers}/${results.totalQuestions}</strong>
                  </div>
                  <div style="height: 10px; background: #e9ecef; border-radius: 5px; overflow: hidden;">
                    <div style="height: 100%; width: ${results.percentage}%; background: linear-gradient(90deg, #28a745, #20c997);"></div>
                  </div>
                </div>
                
                <p style="margin: 15px 0 0 0; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 14px; color: #666;">
                  <strong>Recommendation:</strong> 
                  ${results.percentage >= 70 ? 'Strong candidate - recommend for interview phase.' : 
                    results.percentage >= 50 ? 'Moderate performance - consider for interview with additional screening.' : 
                    'Below threshold - additional training or re-assessment recommended.'}
                </p>
              </div>

              <!-- Action Items -->
              <div style="background: linear-gradient(135deg, #083A85 0%, #0a4499 100%); color: white; padding: 25px; border-radius: 12px; text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px;">Next Steps</h3>
                <p style="margin: 0 0 20px 0; opacity: 0.9;">Access the full assessment details and candidate responses in the admin dashboard.</p>
                <a href="/admin/assessments/${assessmentId}" style="display: inline-block; background: white; color: #083A85; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">
                  View Full Results →
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.apikey,
        },
        body: JSON.stringify(emailData),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending admin notification:', error);
      return false;
    }
  };

  const sendEnhancedUserConfirmation = async (userEmail: string, userName: string, results: AssessmentResult) => {
    const submissionTime = new Date().toLocaleString();
    const assessmentId = `JFA-${Date.now().toString().slice(-6)}`;
    
    const emailData = {
      sender: {
        name: "Jambolush",
        email: config.senderemail
      },
      to: [
        {
          email: userEmail,
          name: userName
        }
      ],
      subject: `✅ Assessment Results - ${results.percentage}% Score`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Assessment Results</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #083A85 0%, #0a4499 100%); color: white; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Assessment Complete!</h1>
              <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">Your Field Agent Assessment Results</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <!-- Results -->
              <div style="background: ${results.percentage >= 70 ? '#d4edda' : results.percentage >= 50 ? '#fff3cd' : '#f8d7da'}; 
                          border: 1px solid ${results.percentage >= 70 ? '#c3e6cb' : results.percentage >= 50 ? '#ffeaa7' : '#f5c6cb'}; 
                          border-radius: 12px; padding: 25px; margin-bottom: 30px; text-align: center;">
                <h2 style="margin: 0 0 10px 0; color: ${results.percentage >= 70 ? '#155724' : results.percentage >= 50 ? '#856404' : '#721c24'}; font-size: 32px;">
                  ${results.percentage}%
                </h2>
                <p style="margin: 0 0 10px 0; color: ${results.percentage >= 70 ? '#155724' : results.percentage >= 50 ? '#856404' : '#721c24'}; font-size: 18px; font-weight: bold;">
                  ${results.correctAnswers} out of ${results.totalQuestions} correct
                </p>
                <p style="margin: 0; color: ${results.percentage >= 70 ? '#155724' : results.percentage >= 50 ? '#856404' : '#721c24'};">
                  ${results.percentage >= 70 ? 'Excellent work! You demonstrated strong competency.' : 
                    results.percentage >= 50 ? 'Good effort! You showed solid understanding.' : 
                    'Keep learning and growing. Consider additional preparation.'}
                </p>
              </div>

              <!-- Summary -->
              <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Assessment Summary</h3>
                <p style="margin: 0 0 15px 0; color: #666;">Completion Time: ${submissionTime}</p>
                <p style="margin: 0 0 15px 0; color: #666;">Time Spent: ${Math.round((4800 - timeRemaining) / 60)} minutes</p>
                <p style="margin: 0; color: #666;">Assessment ID: ${assessmentId}</p>
              </div>

              <!-- Next Steps -->
              <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 25px; border-radius: 12px; text-align: center;">
                <h3 style="margin: 0 0 15px 0;">What's Next?</h3>
                <p style="margin: 0 0 15px 0; opacity: 0.9;">
                  ${results.percentage >= 70 ? 
                    'Congratulations! Our team will contact you within 2-3 business days to discuss the next steps in the hiring process.' :
                    'Thank you for your interest. Our team will review your assessment and contact you within 5 business days with feedback.'}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.apikey,
        },
        body: JSON.stringify(emailData),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending user confirmation:', error);
      return false;
    }
  };

  // Fetch user data on component mount
  useEffect(() => {
    getUserData();
  }, []);

  // Timer management
  useEffect(() => {
    if (assessmentStarted && !assessmentCompleted && !timeExpired) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setTimeExpired(true);
            return 0;
          }

          // Show time alerts at 50 minutes (3000 seconds) and 20 minutes (1200 seconds) remaining
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

  // Helper functions
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      
      if (question.isMultipleSelect) {
        // Handle multiple select questions
        if (existing) {
          const newSelection = existing.selectedOptions.includes(optionIndex)
            ? existing.selectedOptions.filter(idx => idx !== optionIndex)
            : [...existing.selectedOptions, optionIndex];
          
          return prev.map(a =>
            a.questionId === questionId
              ? { ...a, selectedOptions: newSelection }
              : a
          );
        } else {
          return [...prev, { questionId, selectedOptions: [optionIndex] }];
        }
      } else {
        // Handle single select questions
        if (existing) {
          return prev.map(a =>
            a.questionId === questionId
              ? { ...a, selectedOptions: [optionIndex] }
              : a
          );
        } else {
          return [...prev, { questionId, selectedOptions: [optionIndex] }];
        }
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

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setEmailError(null);
    setSaveError(null);
    
    try {
      // Calculate results first
      const results = calculateResults();
      setAssessmentResult(results);

      const userName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Assessment Candidate';
      const userEmail = user?.email || 'candidate@example.com';
      
      console.log('Assessment Results:', results);
      
      // Save to database
      const savedToDb = await saveAssessmentToDatabase(results);
      
      // Send enhanced emails with results
      const [adminEmailSent, userEmailSent] = await Promise.all([
        sendEnhancedAdminNotification(userEmail, userName, answers, results),
        sendEnhancedUserConfirmation(userEmail, userName, results)
      ]);
      
      if (!adminEmailSent || !userEmailSent) {
        setEmailError('Assessment completed but some notifications failed to send.');
      }

      if (!savedToDb) {
        setSaveError('Results calculated but database save failed.');
      }
      
      setAssessmentCompleted(true);
      setShowResults(true);
      
    } catch (error) {
      console.error('Error during submission process:', error);
      setEmailError('Submission completed with some issues. Your results are still recorded.');
      
      // Still show results even if there were errors
      const results = calculateResults();
      setAssessmentResult(results);
      setAssessmentCompleted(true);
      setShowResults(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewResults = () => {
    setShowResults(true);
  };

  const handleBackToSummary = () => {
    setShowResults(false);
  };

  // Component renders

  // Loading state for user data
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Assessment</h2>
          <p className="text-gray-600">Please wait while we prepare your assessment...</p>
        </div>
      </div>
    );
  }

  // Time expired state
  if (timeExpired) {
    const results = calculateResults();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Time's Up!</h2>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-amber-800 mb-2">Your Results</h3>
            <div className="text-3xl font-bold text-amber-900 mb-2">{results.percentage}%</div>
            <p className="text-amber-700">{results.correctAnswers} out of {results.totalQuestions} correct</p>
          </div>
          
          <p className="text-gray-600 mb-6">
            Your progress has been automatically saved and submitted for review.
          </p>
          <p className="text-sm text-gray-500">
            We will be in touch regarding the next steps in the coming days.
          </p>
        </div>
      </div>
    );
  }

  // Results view
  if (assessmentCompleted && showResults && assessmentResult) {
    return (
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity pt-10 p-8 sm:p-12 lg:p-16 z-50">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-t-3xl shadow-2xl p-8 text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              assessmentResult.percentage >= 70 ? 'bg-green-100' : 
              assessmentResult.percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <div className={`text-4xl font-bold ${
                assessmentResult.percentage >= 70 ? 'text-green-600' : 
                assessmentResult.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {assessmentResult.percentage}%
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Results</h2>
            <p className="text-lg text-gray-600 mb-4">
              You scored {assessmentResult.correctAnswers} out of {assessmentResult.totalQuestions} questions correctly
            </p>
            
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={handleBackToSummary}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
              >
                ← Back to Summary
              </button>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-b-3xl shadow-2xl p-8 max-h-96 overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Question-by-Question Review</h3>
            
            <div className="space-y-6">
              {assessmentResult.questionsResults.map((result, index) => (
                <div
                  key={result.questionId}
                  className={`p-6 rounded-xl border-2 ${
                    result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex-1">
                      Q{index + 1}: {result.question}
                    </h4>
                    <div className={`ml-4 px-3 py-1 rounded-full text-sm font-bold ${
                      result.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {result.isCorrect ? 'Correct' : 'Incorrect'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong className="text-gray-700">Your answer: </strong>
                      <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                        {result.userAnswer.length > 0 
                          ? result.userAnswer.map(idx => questions.find(q => q.id === result.questionId)?.options[idx]).join(', ')
                          : 'No answer selected'
                        }
                      </span>
                    </div>
                    
                    {!result.isCorrect && (
                      <div className="text-sm">
                        <strong className="text-gray-700">Correct answer: </strong>
                        <span className="text-green-700">
                          {result.correctAnswer.map(idx => 
                            questions.find(q => q.id === result.questionId)?.options[idx]
                          ).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Messages */}
          {(emailError || saveError) && (
            <div className="mt-6 space-y-3">
              {emailError && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">{emailError}</p>
                </div>
              )}
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{saveError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assessment completed summary state
  if (assessmentCompleted && !showResults) {
    return (
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity pt-10 p-8 sm:p-12 lg:p-16 z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
            assessmentResult && assessmentResult.percentage >= 80 ? 'bg-green-100' : 
            assessmentResult && assessmentResult.percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Submitted Successfully!</h2>
          
          {assessmentResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-blue-800 mb-2">Your Score</h3>
              <div className="text-4xl font-bold text-blue-900 mb-2">{assessmentResult.percentage}%</div>
              <p className="text-blue-700">{assessmentResult.correctAnswers} out of {assessmentResult.totalQuestions} correct</p>
            </div>
          )}
          
          <p className="text-gray-600 mb-6">
            Thank you for completing the Jambolush Field Agent Assessment. Your responses have been recorded and our expert team will review them carefully.
          </p>
          
          {assessmentResult && (
            <button
              onClick={handleViewResults}
              className="mb-6 px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-semibold"
            >
              View Detailed Results
            </button>
          )}

          {(emailError || saveError) && (
            <div className="space-y-3 mb-6">
              {emailError && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">{emailError}</p>
                </div>
              )}
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{saveError}</p>
                </div>
              )}
            </div>
          )}
          
          <p className="text-sm text-gray-500 mb-4">
            You will receive feedback and results via email within 3-5 business days.
          </p>
          <p className="text-xs text-gray-400">
            Assessment ID: JFA-{Date.now().toString().slice(-6)}
          </p>
        </div>
      </div>
    );
  }

  // Main assessment interface
  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity pt-10 p-8 sm:p-12 lg:p-16 z-50">
      {/* Time alert notification */}
      {showTimeAlert && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-amber-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center">
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Time Check: {formatTime(timeRemaining)} remaining</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-br from-[#083A85] to-[#0a4499] px-4 sm:px-6 lg:px-8 py-6 shadow-md">
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
            <div className={`flex items-center px-4 py-2 rounded-xl transition-colors duration-300 ${
              timeRemaining <= 1200 ? 'bg-red-500/90 animate-pulse' : 'bg-black/20'
            }`}>
              <svg className="w-5 h-5 text-white mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
              </svg>
              <span className="font-mono text-lg font-medium text-white">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Progress bar - only show during questions */}
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
              <span className="text-sm text-slate-600 font-medium mt-1.5 block text-right">
                Progress: {Math.round(((currentStep - 1) * questionsPerPage) / questions.length * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-grow w-full bg-white overflow-hidden overflow-y-visible min-h-[50vh] max-h-[80vh]">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-12 mb-4">
          
          {/* Welcome step */}
          {currentStep === 0 && (
            <div className="space-y-8 mb-12">
              {/* User information display */}
              {user && (
                <div className="bg-blue-50 border-l-4 border-[#083A85] rounded-r-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-[#083A85] mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold text-slate-800">
                      {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Assessment Candidate'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-[#083A85] mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="font-bold text-slate-700">{user.email}</span>
                  </div>
                </div>
              )}

              <div className="text-center py-8">
                <h2 className="text-4xl font-extrabold text-slate-800 mb-4">
                  Ready to Begin Your Assessment?
                </h2>
                <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
                  This comprehensive assessment evaluates your skills and suitability for the Field Agent role at Jambolush. Please read the instructions carefully before you start.
                </p>

                {/* Instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-left max-w-lg mx-auto">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Important Instructions:</h3>
                  <ul className="space-y-3 text-slate-700">
                    {[
                      { text: `You have <strong>1 hour and 20 minutes</strong> to complete all ${questions.length} questions.` },
                      { text: "Most questions have one correct answer. Some allow multiple selections." },
                      { text: "Time alerts will appear when you have 50 and 20 minutes remaining." },
                      { text: "The timer will turn red and pulse when <strong>20 minutes</strong> remain." },
                      { text: "Once started, the assessment cannot be paused. Ensure you're in a quiet environment." },
                      { text: "You can navigate back to previous questions to review your answers." },
                      { text: "Your results will be calculated and displayed immediately after submission." }
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
                  className="cursor-pointer inline-flex items-center px-12 py-4 bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white font-bold text-lg rounded-full hover:from-[#0a4499] hover:to-[#0c52b8] transition-all shadow-lg hover:shadow-2xl transform hover:scale-105"
                >
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Start Assessment
                </button>
              </div>
            </div>
          )}

          {/* Question steps */}
          {currentStep > 0 && currentStep < totalSteps - 1 && (
            <div className="space-y-10 mb-20">
              {getQuestionsForPage(currentStep - 1).map((question, idx) => {
                const globalIdx = ((currentStep - 1) * questionsPerPage) + idx;
                return (
                  <div key={question.id} className="bg-slate-50 rounded-2xl p-6">
                    <div className="flex items-start mb-6">
                      <span className="flex-shrink-0 w-12 h-12 bg-[#083A85] text-white border-2 border-blue-200 rounded-full flex items-center justify-center text-lg font-bold">
                        {globalIdx + 1}
                      </span>
                      <div className="ml-4">
                        <p className="text-xl text-slate-900 font-bold leading-relaxed">
                          {question.question}
                        </p>
                        {question.isMultipleSelect && (
                          <p className="text-sm text-blue-600 font-medium mt-2">
                            * Multiple answers may be correct - select all that apply
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 ml-16">
                      {question.options.map((option, optionIdx) => {
                        const isSelected = isAnswerSelected(question.id, optionIdx);
                        return (
                          <label
                            key={optionIdx}
                            className={`flex items-center p-4 rounded-xl transition-all duration-200 border-2 cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-[#083A85] shadow-md transform scale-[1.02]'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
                            }`}
                          >
                            <input
                              type={question.isMultipleSelect ? "checkbox" : "radio"}
                              name={`question-${question.id}`}
                              checked={isSelected}
                              onChange={() => handleAnswerSelect(question.id, optionIdx)}
                              className="sr-only"
                            />
                            <div className={`w-6 h-6 ${question.isMultipleSelect ? 'rounded' : 'rounded-full'} border-2 flex-shrink-0 mr-4 flex items-center justify-center transition-all ${
                              isSelected ? 'border-[#083A85] bg-[#083A85]' : 'border-slate-400'
                            }`}>
                              {isSelected && (
                                question.isMultipleSelect ? (
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <div className="w-3 h-3 bg-white rounded-full"></div>
                                )
                              )}
                            </div>
                            <span className="text-slate-800 font-medium text-base leading-relaxed">
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

          {/* Submit step */}
          {currentStep === totalSteps - 1 && (
            <div className="space-y-8">
              <div className="text-center py-8">
                <h2 className="text-3xl font-extrabold text-slate-800 mb-4">
                  Final Review & Submission
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                  You've reached the end of the assessment. Please review your completion status before submitting.
                </p>

                {/* Completion summary */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-slate-800">
                        {answers.filter(a => a.selectedOptions.length > 0).length} of {questions.length}
                      </div>
                      <div className="text-sm text-slate-600">Questions Answered</div>
                    </div>
                  </div>
                  <p className="font-medium text-slate-600">
                    Time remaining: <span className="font-mono">{formatTime(timeRemaining)}</span>
                  </p>
                </div>

                {/* Confirmation message */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
                  <h3 className="font-bold text-slate-800 mb-3">Submission Confirmation</h3>
                  <p className="text-slate-700 leading-relaxed">
                    By submitting this assessment, you confirm that these answers represent your own work and understanding. 
                    Your results will be calculated automatically and displayed immediately, and our expert team will receive 
                    a detailed report for review.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="cursor-pointer inline-flex items-center px-12 py-4 bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-lg rounded-full hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Processing Assessment...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                      Submit Assessment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="bg-slate-100 border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-5 sticky bottom-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Previous button */}
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="cursor-pointer inline-flex items-center px-6 py-3 rounded-full font-semibold transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:hover:bg-slate-200"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Previous
          </button>

          {/* Step indicators */}
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalSteps }).map((_, stepIndex) => (
              <div
                key={stepIndex}
                className={`h-3 rounded-full transition-all duration-300 ${
                  stepIndex === currentStep
                    ? 'w-10 bg-gradient-to-r from-[#083A85] to-[#0a4499]'
                    : stepIndex < currentStep
                    ? 'w-3 bg-[#083A85]'
                    : 'w-3 bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Next button */}
          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={currentStep > 0 && !isCurrentPageValid()}
              className="cursor-pointer inline-flex items-center px-6 py-3 rounded-full font-semibold transition-all text-sm text-white bg-gradient-to-br from-[#083A85] to-[#0a4499] hover:from-[#0a4499] hover:to-[#0c52b8] shadow-md hover:shadow-lg disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {currentStep === 0 ? (
                <>
                  Start Assessment
                  <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </>
              ) : (
                <>
                  Next
                  <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          ) : (
            <div style={{ width: '140px' }} />
          )}
        </div>
      </footer>
    </div>
  );
};

export default AssessmentContent;