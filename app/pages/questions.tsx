'use client';

import React, { useState, useEffect, useRef } from 'react';

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

interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: string;
}

const AssessmentContent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(4800); // 80 minutes in seconds
  const [showTimeAlert, setShowTimeAlert] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Email configuration - these should be set in your environment variables
  const config = {
    apikey: process.env.BREVO_API_KEY || 'your-brevo-api-key-here',
    senderemail: process.env.RSENDER_EMAIL || 'noreply@jambolush.com'
  };

  // API service for making authenticated requests
  const api = {
    get: async (endpoint: string) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { data };
    },
    
    post: async (endpoint: string, data: any) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data_result = await response.json();
      return { data: data_result };
    }
  };

  // Get user data from auth/me endpoint
  const getUserData = async () => {
    try {
      setIsLoadingUser(true);
      const response = await api.get('auth/me');
      
      if (response.data) {
        const userData: UserProfile = response.data;
        setUser(userData);
        console.log('User data fetched successfully:', userData);
        return userData;
      } else {
        console.warn('No user data received from auth/me');
        // Fallback user data for testing
        const fallbackUser: UserProfile = {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          userType: 'agent'
        };
        setUser(fallbackUser);
        return fallbackUser;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback user data for testing
      const fallbackUser: UserProfile = {
        id: 'fallback-user',
        email: 'fallback@example.com',
        name: 'Fallback User',
        firstName: 'Fallback',
        lastName: 'User',
        userType: 'agent'
      };
      setUser(fallbackUser);
      return fallbackUser;
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Send email to admin using Brevo API
  const sendAdminNotification = async (userEmail: string, userName: string, userAnswers: Answer[]) => {
    const completedQuestions = userAnswers.filter(a => a.selectedOptions.length > 0).length;
    const completionPercentage = Math.round((completedQuestions / questions.length) * 100);
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
      subject: `🎯 New Field Agent Assessment Completed - ${userName}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Assessment Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #083A85 0%, #0a4499 100%); color: white; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; line-height: 1.2;">New Assessment Completed</h1>
              <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">Jambolush Field Agent Assessment System</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <!-- Alert Banner -->
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 30px; text-align: center;">
                <strong style="color: #856404;">🚨 Action Required: New Assessment Awaiting Review</strong>
              </div>

              <!-- Candidate Information -->
              <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #083A85;">
                <h2 style="margin: 0 0 20px 0; color: #083A85; font-size: 20px;">Candidate Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555; width: 140px; border-bottom: 1px solid #dee2e6;">Full Name:</td>
                    <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #dee2e6;">${userName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555; border-bottom: 1px solid #dee2e6;">Email Address:</td>
                    <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #dee2e6;">${userEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555; border-bottom: 1px solid #dee2e6;">Assessment ID:</td>
                    <td style="padding: 10px 0; color: #333; font-family: monospace; border-bottom: 1px solid #dee2e6;">${assessmentId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Submission Time:</td>
                    <td style="padding: 10px 0; color: #333;">${submissionTime}</td>
                  </tr>
                </table>
              </div>

              <!-- Assessment Statistics -->
              <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">Assessment Statistics</h3>
                
                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                  <div style="flex: 1; text-align: center; padding: 20px; background: #e3f2fd; border-radius: 10px; border: 2px solid #1976d2;">
                    <div style="font-size: 32px; font-weight: bold; color: #1976d2; margin-bottom: 5px;">${completedQuestions}</div>
                    <div style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600;">Questions Answered</div>
                    <div style="font-size: 14px; color: #888; margin-top: 2px;">out of ${questions.length}</div>
                  </div>
                  <div style="flex: 1; text-align: center; padding: 20px; background: #e8f5e8; border-radius: 10px; border: 2px solid #388e3c;">
                    <div style="font-size: 32px; font-weight: bold; color: #388e3c; margin-bottom: 5px;">${completionPercentage}%</div>
                    <div style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600;">Completion Rate</div>
                    <div style="font-size: 14px; color: #888; margin-top: 2px;">assessment progress</div>
                  </div>
                </div>

                <!-- Assessment Details -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                  <h4 style="margin: 0 0 15px 0; color: #333;">Assessment Overview</h4>
                  <ul style="color: #555; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li><strong>Assessment Type:</strong> Field Agent Evaluation</li>
                    <li><strong>Duration:</strong> 80 minutes (1 hour 20 minutes)</li>
                    <li><strong>Question Categories:</strong> Situational judgment, problem-solving, ethics, technical skills</li>
                    <li><strong>Format:</strong> Multiple choice with single correct answers</li>
                  </ul>
                </div>
              </div>

              <!-- Next Steps -->
              <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">Recommended Next Steps</h3>
                
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
                    <div style="width: 30px; height: 30px; background: #083A85; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold;">1</div>
                    <div>
                      <h4 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">Review Assessment Responses</h4>
                      <p style="margin: 0; color: #666; line-height: 1.5;">Log into the admin dashboard to review detailed responses and evaluate candidate suitability.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
                    <div style="width: 30px; height: 30px; background: #083A85; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold;">2</div>
                    <div>
                      <h4 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">Conduct Scoring & Evaluation</h4>
                      <p style="margin: 0; color: #666; line-height: 1.5;">Use the assessment rubric to score responses and determine if the candidate meets requirements.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
                    <div style="width: 30px; height: 30px; background: #083A85; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold;">3</div>
                    <div>
                      <h4 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">Schedule Follow-up Interview</h4>
                      <p style="margin: 0; color: #666; line-height: 1.5;">If the candidate passes the assessment, schedule a follow-up interview within 5 business days.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: flex-start; gap: 15px;">
                    <div style="width: 30px; height: 30px; background: #083A85; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold;">4</div>
                    <div>
                      <h4 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">Provide Candidate Feedback</h4>
                      <p style="margin: 0; color: #666; line-height: 1.5;">Send feedback to the candidate within 3-5 business days, regardless of the outcome.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Call to Action -->
              <div style="background: linear-gradient(135deg, #083A85 0%, #0a4499 100%); color: white; padding: 25px; border-radius: 12px; text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px;">Ready to Review?</h3>
                <p style="margin: 0 0 20px 0; opacity: 0.9; line-height: 1.5;">Access the admin dashboard to begin your assessment review process.</p>
                <a href="/admin/assessments" style="display: inline-block; background: white; color: #083A85; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; transition: all 0.3s ease;">
                  Review Assessment Now →
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                This is an automated notification from the Jambolush Assessment System.
              </p>
              <p style="margin: 0; color: #6c757d; font-size: 12px;">
                For questions, contact the development team or check the admin documentation.
              </p>
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

      if (response.ok) {
        console.log('Admin notification email sent successfully');
        return true;
      } else {
        const errorText = await response.text();
        console.error('Failed to send admin notification:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('Error sending admin notification:', error);
      return false;
    }
  };

  // Send confirmation email to user using Brevo API
  const sendUserConfirmation = async (userEmail: string, userName: string) => {
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
      subject: `✅ Assessment Submitted Successfully - Welcome to Jambolush!`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Assessment Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #083A85 0%, #0a4499 100%); color: white; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; line-height: 1.2;">Assessment Submitted Successfully!</h1>
              <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">Thank you for completing the Field Agent Assessment</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <!-- Success Message -->
              <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 12px; padding: 25px; margin-bottom: 30px; text-align: center;">
                <div style="width: 60px; height: 60px; background: #28a745; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 28px; color: white;">✓</span>
                </div>
                <h2 style="margin: 0 0 10px 0; color: #155724; font-size: 24px;">Congratulations, ${userName}!</h2>
                <p style="margin: 0; color: #155724; font-size: 16px; line-height: 1.5;">
                  Your Field Agent Assessment has been successfully submitted and is now under review by our expert team.
                </p>
              </div>

              <!-- Assessment Summary -->
              <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">Assessment Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; font-weight: bold; color: #555; width: 150px; border-bottom: 1px solid #dee2e6;">Candidate Name:</td>
                    <td style="padding: 12px 0; color: #333; border-bottom: 1px solid #dee2e6;">${userName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; font-weight: bold; color: #555; border-bottom: 1px solid #dee2e6;">Email Address:</td>
                    <td style="padding: 12px 0; color: #333; border-bottom: 1px solid #dee2e6;">${userEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; font-weight: bold; color: #555; border-bottom: 1px solid #dee2e6;">Assessment Type:</td>
                    <td style="padding: 12px 0; color: #333; border-bottom: 1px solid #dee2e6;">Field Agent Evaluation</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; font-weight: bold; color: #555; border-bottom: 1px solid #dee2e6;">Total Questions:</td>
                    <td style="padding: 12px 0; color: #333; border-bottom: 1px solid #dee2e6;">40 Questions</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; font-weight: bold; color: #555; border-bottom: 1px solid #dee2e6;">Submission Time:</td>
                    <td style="padding: 12px 0; color: #333; border-bottom: 1px solid #dee2e6;">${submissionTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; font-weight: bold; color: #555;">Reference ID:</td>
                    <td style="padding: 12px 0; color: #333; font-family: monospace; background: #e9ecef; padding: 8px; border-radius: 4px;">${assessmentId}</td>
                  </tr>
                </table>
              </div>

              <!-- What Happens Next -->
              <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">What Happens Next?</h3>
                
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 20px;">
                    <div style="width: 35px; height: 35px; background: #e3f2fd; border: 2px solid #1976d2; color: #1976d2; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold;">1</div>
                    <div>
                      <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Expert Review Process</h4>
                      <p style="margin: 0; color: #666; line-height: 1.6;">Our experienced team will carefully review and evaluate your responses against our comprehensive assessment criteria.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 20px;">
                    <div style="width: 35px; height: 35px; background: #e3f2fd; border: 2px solid #1976d2; color: #1976d2; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold;">2</div>
                    <div>
                      <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Evaluation Timeline</h4>
                      <p style="margin: 0; color: #666; line-height: 1.6;">You can expect to receive feedback and results within <strong style="color: #1976d2;">3-5 business days</strong> of your submission.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 20px;">
                    <div style="width: 35px; height: 35px; background: #e3f2fd; border: 2px solid #1976d2; color: #1976d2; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold;">3</div>
                    <div>
                      <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Interview Invitation</h4>
                      <p style="margin: 0; color: #666; line-height: 1.6;">Successful candidates will be invited to participate in a follow-up interview to discuss the role in more detail.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: flex-start; gap: 15px;">
                    <div style="width: 35px; height: 35px; background: #e3f2fd; border: 2px solid #1976d2; color: #1976d2; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold;">4</div>
                    <div>
                      <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Onboarding Process</h4>
                      <p style="margin: 0; color: #666; line-height: 1.6;">If selected, we'll guide you through our comprehensive onboarding program to ensure your success as a Field Agent.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Important Notes -->
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                <h4 style="margin: 0 0 12px 0; color: #856404; font-size: 16px;">📋 Important Notes</h4>
                <ul style="color: #856404; line-height: 1.7; margin: 0; padding-left: 20px;">
                  <li>Please keep this email and your reference ID for future correspondence</li>
                  <li>We will contact you exclusively via email, so please check your inbox regularly</li>
                  <li>If you don't hear from us within 5 business days, please check your spam folder</li>
                  <li>Feel free to reach out if you have any questions about the process</li>
                </ul>
              </div>

              <!-- Thank You Message -->
              <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 12px; text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">Thank You for Your Interest!</h3>
                <p style="margin: 0; opacity: 0.95; line-height: 1.6; font-size: 16px;">
                  We appreciate the time and effort you've invested in this assessment. Your dedication to joining our Field Agent team is valued, and we're excited about the possibility of working together to create exceptional experiences for our guests worldwide.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #083A85; color: white; padding: 30px; text-align: center;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px;">Stay Connected with Jambolush</h3>
              <p style="margin: 0 0 20px 0; opacity: 0.9; line-height: 1.5;">
                Follow us on social media for the latest updates, opportunities, and company news.
              </p>
              
              <div style="margin: 20px 0;">
                <p style="margin: 0; opacity: 0.8; font-size: 14px;">
                  Questions about your assessment? Contact us at 
                  <a href="mailto:careers@jambolush.com" style="color: #87CEEB; text-decoration: none;">careers@jambolush.com</a>
                </p>
              </div>
              
              <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
                <p style="margin: 0; opacity: 0.7; font-size: 12px;">
                  © 2024 Jambolush. All rights reserved. | This email was sent regarding your Field Agent Assessment.
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

      if (response.ok) {
        console.log('User confirmation email sent successfully');
        return true;
      } else {
        const errorText = await response.text();
        console.error('Failed to send user confirmation:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('Error sending user confirmation:', error);
      return false;
    }
  };

  // All 40 assessment questions
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
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a =>
          a.questionId === questionId
            ? { ...a, selectedOptions: [optionIndex] }
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

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setEmailError(null);
    
    try {
      const userName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Assessment Candidate';
      const userEmail = user?.email || 'candidate@example.com';
      
      console.log('Starting email submission process...');
      console.log('User Name:', userName);
      console.log('User Email:', userEmail);
      console.log('Assessment Answers:', answers);
      
      // Send both emails concurrently
      const [adminEmailSent, userEmailSent] = await Promise.all([
        sendAdminNotification(userEmail, userName, answers),
        sendUserConfirmation(userEmail, userName)
      ]);
      
      if (adminEmailSent && userEmailSent) {
        console.log('✅ Both emails sent successfully');
      } else if (adminEmailSent) {
        console.log('⚠️ Admin email sent, but user confirmation failed');
        setEmailError('Assessment submitted successfully, but confirmation email failed to send.');
      } else if (userEmailSent) {
        console.log('⚠️ User confirmation sent, but admin notification failed');
        setEmailError('Assessment submitted, but admin notification failed.');
      } else {
        console.log('❌ Both emails failed to send');
        setEmailError('Assessment submitted, but email notifications failed. We will still review your submission.');
      }
      
      // You can add additional API call here to save assessment data to your database
      // await api.post('assessments', { answers, userId: user?.id, completedAt: new Date() });
      
      setAssessmentCompleted(true);
      
    } catch (error) {
      console.error('Error during submission process:', error);
      setEmailError('There was an issue with the submission process, but your assessment has been recorded.');
      setAssessmentCompleted(true); // Still mark as completed
    } finally {
      setIsSubmitting(false);
    }
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="bi bi-clock text-red-600" style={{ fontSize: '3rem' }}></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Time's Up!</h2>
          <p className="text-gray-600 mb-8">
            Unfortunately, you've run out of time. Your progress has been saved and will be reviewed by our team.
          </p>
          <p className="text-sm text-gray-500">
            We will be in touch regarding the next steps in the coming days.
          </p>
        </div>
      </div>
    );
  }

  // Assessment completed state
  if (assessmentCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="bi bi-check-circle-fill text-green-600" style={{ fontSize: '3rem' }}></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing the Jambolush Field Agent Assessment. Your responses are now under review by our expert team.
          </p>
          {emailError && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 text-sm">{emailError}</p>
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
    <div className="min-h-screen w-full bg-slate-50 font-sans flex flex-col pt-10">
      {/* Time alert notification */}
      {showTimeAlert && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-amber-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center">
            <i className="bi bi-exclamation-circle-fill me-3"></i>
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
            <div className={`flex items-center px-4 py-2 rounded-xl transition-colors duration-300 ${timeRemaining <= 1200 ? 'bg-red-500/90 animate-pulse' : 'bg-black/20'
              }`}>
              <i className="bi bi-clock-fill text-white me-2"></i>
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
      <main className="flex-grow w-full bg-white">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-12">
          
          {/* Welcome step */}
          {currentStep === 0 && (
            <div className="space-y-8">
              {/* User information display */}
              {user && (
                <div className="bg-blue-50 border-l-4 border-[#083A85] rounded-r-lg p-6">
                  <div className="flex items-center mb-4">
                    <i className="bi bi-person-fill text-[#083A85] me-3"></i>
                    <span className="font-semibold text-slate-800">
                      {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Assessment Candidate'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <i className="bi bi-envelope-fill text-[#083A85] me-3"></i>
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
                      { text: `You have <strong>1 hour and 20 minutes</strong> to complete all 40 questions.` },
                      { text: "Each question has only one correct answer. Choose the most appropriate option." },
                      { text: "Time alerts will appear when you have 50 and 20 minutes remaining." },
                      { text: "The timer will turn red and pulse when <strong>20 minutes</strong> remain." },
                      { text: "Once started, the assessment cannot be paused. Ensure you're in a quiet environment." },
                      { text: "You can navigate back to previous questions to review your answers." }
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
                  className="cursor-pointer inline-flex place-items-center px-12 py-4 bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white font-bold text-lg rounded-full hover:from-[#0a4499] hover:to-[#0c52b8] transition-all shadow-lg hover:shadow-2xl transform hover:scale-105"
                >
                  <i className="bi bi-play-fill me-2" style={{ fontSize: '1.5rem' }}></i>
                  Start Assessment
                </button>
              </div>
            </div>
          )}

          {/* Question steps */}
          {currentStep > 0 && currentStep < totalSteps - 1 && (
            <div className="space-y-10">
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
                      </div>
                    </div>

                    <div className="space-y-3 ml-16">
                      {question.options.map((option, optionIdx) => {
                        const isSelected = isAnswerSelected(question.id, optionIdx);
                        return (
                          <label
                            key={optionIdx}
                            className={`flex items-center p-4 rounded-xl transition-all duration-200 border-2 cursor-pointer ${isSelected
                              ? 'bg-blue-50 border-[#083A85] shadow-md transform scale-[1.02]'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
                              }`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              checked={isSelected}
                              onChange={() => handleAnswerSelect(question.id, optionIdx)}
                              className="sr-only"
                            />
                            <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mr-4 flex items-center justify-center transition-all ${isSelected ? 'border-[#083A85] bg-[#083A85]' : 'border-slate-400'}`}>
                                {isSelected && <div className="w-3 h-3 bg-white rounded-full"></div>}
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
                    <i className="bi bi-check-circle-fill text-green-600 me-3" style={{ fontSize: '2.5rem' }}></i>
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
                    Our expert team will review your responses carefully, and you will receive feedback within 3-5 business days.
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
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin me-3"></div>
                      Submitting Assessment...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill me-3" style={{ fontSize: '1.5rem' }}></i>
                      Submit Assessment
                    </>
                  )}
                </button>

                {/* Error message */}
                {emailError && (
                  <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-amber-800 text-sm">{emailError}</p>
                  </div>
                )}
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
            <i className="bi bi-chevron-left me-2"></i>
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
                  <i className="bi bi-chevron-right ms-2"></i>
                </>
              ) : (
                <>
                  Next
                  <i className="bi bi-chevron-right ms-2"></i>
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