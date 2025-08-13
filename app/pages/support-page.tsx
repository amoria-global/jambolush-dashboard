import React, { useState } from 'react';

// Define interfaces for type safety
interface FAQ {
  question: string;
  answer: string;
}

interface Section {
  title: string;
  icon: React.ReactNode; // Changed from JSX.Element to React.ReactNode
  faqs?: FAQ[]; // faqs are optional for the contact section
}

interface SectionsData {
  [key: string]: Section;
}

// Mock data for FAQ sections
const sectionsData: SectionsData = {
  gettingStarted: {
    title: "Getting Started",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    faqs: [
      { question: "How do I create an account or log in?", answer: "To create a new account, click the 'Sign Up' button on the homepage and follow the prompts. If you already have an account, click 'Log In' and enter your credentials." },
      { question: "How to view booking status/history?", answer: "Your booking history is available in the 'My Bookings' section of your profile. Here you can see past and upcoming bookings, as well as their current status." },
      { question: "How to search for bookings?", answer: "You can search for specific bookings using the search bar at the top of the 'My Bookings' page. You can search by guest name, property name, or booking ID." },
    ]
  },
  bookingManagement: {
    title: "Booking Management",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    faqs: [
      { question: "How to modify or cancel bookings?", answer: "Modifying or canceling a booking can be done from the 'My Bookings' page. Select the booking you wish to change and follow the on-screen instructions. Note that cancellation policies may apply." },
      { question: "What is the refund policy?", answer: "Refund policies vary based on the property and cancellation timing. You can view the specific policy for your booking on the booking details page." },
      { question: "How to check booking confirmation and receipts?", answer: "After a successful booking, a confirmation email is sent to you. You can also find a copy of your receipt and confirmation on the booking details page." },
    ]
  },
  paymentAndBilling: {
    title: "Payment & Billing",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    faqs: [
      { question: "What payment methods are accepted?", answer: "We accept all major credit cards, as well as PayPal. You can add or update your payment information in your 'Account Settings'." },
      { question: "What to do if a payment fails?", answer: "If your payment fails, please check that your payment information is correct. If the problem persists, contact your bank or credit card provider." },
      { question: "How to update payment information?", answer: "You can update your saved payment methods in the 'Payment & Billing' section of your account settings." },
    ]
  },
  accountAndProfile: {
    title: "Account & Profile",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    faqs: [
      { question: "How do I update my profile information?", answer: "You can update your profile by navigating to the 'Settings' page. Click on 'Edit Profile' to change your personal details, password, and other preferences." },
      { question: "How to reset my password?", answer: "If you forget your password, click 'Forgot Password' on the login screen. We will send a password reset link to your registered email address." },
      { question: "Tips for account security?", answer: "We recommend using a strong, unique password and enabling two-factor authentication for added security." },
    ]
  },
  troubleshooting: {
    title: "Troubleshooting & FAQs",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9.228a2.44 2.44 0 013.464 0M15.485 16.485a2.44 2.44 0 01-3.464 0M9 11v-5a3 3 0 016 0v5a3 3 0 01-6 0z" />
      </svg>
    ),
    faqs: [
      { question: "My booking is not showing up, what should I do?", answer: "There might be a slight delay in data synchronization. Please try refreshing the page. If the issue persists, contact our support team with your booking details." },
      { question: "I haven't received a confirmation email.", answer: "Please check your spam or junk folder. If it's not there, it's possible there was a typo in your email address. Contact our support team for assistance." },
      { question: "I was double-booked, how do I fix this?", answer: "In the rare event of a double booking, please contact support immediately. We will work quickly to resolve the issue and ensure you are properly accommodated." },
    ]
  },
  contact: {
    title: "Contact Support",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
};

/**
 * Helper function to highlight the search term in a string.
 * @param {string} text - The text to search within.
 * @param {string} term - The search term to highlight.
 * @returns {React.ReactNode} The text with the search term wrapped in a <mark> tag.
 */
const highlightText = (text: string, term: string): React.ReactNode => {
  if (!term) return text;
  const parts = text.split(new RegExp(`(${term})`, 'gi'));
  return parts.map((part, index) =>
    new RegExp(term, 'i').test(part) ? <mark key={index} className="bg-yellow-200">{part}</mark> : part
  );
};

/**
 * Reusable component for a single FAQ item.
 * @param {Object} props - The component props.
 * @param {string} props.question - The FAQ question.
 * @param {string} props.answer - The FAQ answer.
 * @param {boolean} props.isOpen - Whether the answer is currently visible.
 * @param {Function} props.onClick - The function to call when the question is clicked.
 * @param {string} props.searchTerm - The current search term to highlight.
 */
const FAQItem = ({ question, answer, isOpen, onClick, searchTerm }: { question: string; answer: string; isOpen: boolean; onClick: () => void; searchTerm: string; }) => {
  const highlightedQuestion = highlightText(question, searchTerm);
  const highlightedAnswer = highlightText(answer, searchTerm);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={onClick}
        className="flex justify-between items-center w-full text-left text-lg font-semibold text-gray-800 focus:outline-none"
      >
        <span>{highlightedQuestion}</span>
        <span>
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </button>
      {isOpen && (
        <p className="mt-2 text-gray-600 transition-all duration-300 ease-in-out">{highlightedAnswer}</p>
      )}
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('gettingStarted');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFAQClick = (question: string) => {
    setOpenFAQ(openFAQ === question ? null : question);
  };

  // Combine and filter all FAQs for search functionality
  const allFaqs = Object.values(sectionsData).flatMap(section => section.faqs ? section.faqs.map(faq => ({ ...faq, section: section.title })) : []);
  const filteredFaqs = allFaqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (searchTerm) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Search Results</h2>
          {filteredFaqs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredFaqs.map((item) => (
                <FAQItem
                  key={item.question}
                  question={item.question}
                  answer={item.answer}
                  searchTerm={searchTerm}
                  isOpen={openFAQ === item.question}
                  onClick={() => handleFAQClick(item.question)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No results found for "{searchTerm}".</p>
          )}
        </div>
      );
    }

    const section = sectionsData[activeTab];
    if (!section) return null;

    if (activeTab === 'contact') {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Support</h2>
          <p className="text-gray-600 mb-4">
            If you can't find the answer you're looking for, please don't hesitate to reach out to our friendly support team.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800">Email Support</h3>
              <p className="text-gray-600">
                Email us at <a href="mailto:support@jambolush.com" className="text-[#083A85] hover:underline">support@jambolush.com</a>
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800">Phone Support</h3>
              <p className="text-gray-600">
                Call us at <a href="tel:+250788437347" className="text-[#083A85] hover:underline">+250 788 437 347</a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{section.title}</h2>
        <div className="divide-y divide-gray-200">
          {section.faqs && section.faqs.map((item) => (
            <FAQItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              isOpen={openFAQ === item.question}
              onClick={() => handleFAQClick(item.question)}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8 font-sans">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Help & Support</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="md:w-1/4">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Support Topics</h2>
              <nav>
                {Object.keys(sectionsData).map(key => {
                  const section = sectionsData[key];
                  const isActive = activeTab === key && !searchTerm;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveTab(key);
                        setSearchTerm('');
                        setOpenFAQ(null);
                      }}
                      className={`flex items-center w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                        isActive ? 'bg-[#083A85] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {section.icon}
                      <span className="font-semibold">{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:w-3/4">
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search FAQs, topics..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setOpenFAQ(null);
                }}
                className="w-full p-3 rounded-xl shadow-md border-gray-300 focus:border-[#083A85] focus:ring focus:ring-[#083A85] focus:ring-opacity-50 transition-colors"
              />
            </div>
            
            {/* Content Display */}
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
