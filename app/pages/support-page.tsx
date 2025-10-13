"use client"
import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/apiService'; // Adjust the import path as needed

// Import types from apiService
import type { FAQ, Article, SupportTicket, HelpFilters, HelpResponse } from '../api/apiService';

type ViewMode = 'FAQS' | 'articles' | 'contact' | 'tickets';
type SortField = 'relevance' | 'date' | 'popularity' | 'category';

const HelpSupportCenter: React.FC = () => {
  // Date formatting helper
  const format = (date: Date | string, formatStr: string = 'MMM dd, yyyy') => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    switch(formatStr) {
      case 'MMM dd, yyyy':
        return `${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
      case 'MMM dd':
        return `${months[month]} ${day.toString().padStart(2, '0')}`;
      default:
        return `${months[month]} ${day}, ${year}`;
    }
  };

  // States
  const [activeView, setActiveView] = useState<ViewMode>('FAQS');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('relevance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Data states
  const [FAQS, setFAQS] = useState<FAQ[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium' as 'urgent' | 'high' | 'medium' | 'low'
  });

  // Contact form state
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: 'General Inquiry',
    message: '',
    loading: false
  });

  // Fetch data based on current view and filters
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: HelpFilters = {
        search: searchTerm || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        sortBy: sortField,
        page: currentPage,
        limit: itemsPerPage
      };

      switch (activeView) {
        case 'FAQS': {
          const response = await api.getFAQs(filters);
          if (response.data.success) {
            setFAQS(response.data.data.items);
            setTotalResults(response.data.data.total);
            setTotalPages(response.data.data.totalPages);
            if (response.data.data.categories) {
              setCategories(response.data.data.categories);
            }
          }
          break;
        }
        case 'articles': {
          const response = await api.getArticles(filters);
          if (response.data.success) {
            setArticles(response.data.data.items);
            setTotalResults(response.data.data.total);
            setTotalPages(response.data.data.totalPages);
            if (response.data.data.categories) {
              setCategories(response.data.data.categories);
            }
          }
          break;
        }
        case 'tickets': {
          const response = await api.getSupportTickets(filters);
          if (response.data.success) {
            setTickets(response.data.data.items);
            setTotalResults(response.data.data.total);
            setTotalPages(response.data.data.totalPages);
            if (response.data.data.categories) {
              setCategories(response.data.data.categories);
            }
          }
          break;
        }
        default:
          break;
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.getHelpCategories();
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch data when dependencies change
  useEffect(() => {
    if (activeView !== 'contact') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [activeView, searchTerm, categoryFilter, sortField, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, categoryFilter, sortField, activeView]);

  // Get current content for display
  const currentContent = useMemo(() => {
    switch (activeView) {
      case 'FAQS':
        return FAQS;
      case 'articles':
        return articles;
      case 'tickets':
        return tickets;
      default:
        return [];
    }
  }, [activeView, FAQS, articles, tickets]);

  // Handlers
  const handleFAQClick = async (faqId: string) => {
    setOpenFAQ(openFAQ === faqId ? null : faqId);
  };

  const handleFAQHelpful = async (faqId: string) => {
    try {
      const response = await api.markFAQHelpful(faqId);
      if (response.data.success) {
        // Update the FAQ in the list
        setFAQS(prev => prev.map(faq => 
          faq.id === faqId 
            ? { ...faq, helpful: response.data.data.helpful }
            : faq
        ));
      }
    } catch (err) {
      console.error('Error marking FAQ as helpful:', err);
    }
  };

  const handleTicketSubmit = async () => {
    if (!newTicket.subject || !newTicket.description) return;

    try {
      const response = await api.createSupportTicket(newTicket);
      if (response.data.success) {
        // Add new ticket to the list if we're viewing tickets
        if (activeView === 'tickets') {
          setTickets(prev => [response.data.data, ...prev]);
        }
        setNewTicket({ subject: '', description: '', category: 'general', priority: 'medium' });
        setShowTicketModal(false);
        alert('Support ticket submitted successfully!');
      }
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      alert('Failed to create ticket. Please try again.');
    }
  };

  const handleContactSubmit = async () => {
    if (!contactForm.subject || !contactForm.message) return;

    setContactForm(prev => ({ ...prev, loading: true }));

    try {
      const response = await api.sendContactMessage({
        subject: contactForm.subject,
        category: contactForm.category,
        message: contactForm.message
      });

      if (response.data.success) {
        setContactForm({ subject: '', category: 'General Inquiry', message: '', loading: false });
        alert('Message sent successfully! We\'ll get back to you soon.');
      }
    } catch (err: any) {
      console.error('Error sending contact message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setContactForm(prev => ({ ...prev, loading: false }));
    }
  };

  const handleArticleClick = async (articleId: string) => {
    try {
      await api.incrementArticleViews(articleId);
      // Update view count in the list
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, views: article.views + 1 }
          : article
      ));
    } catch (err) {
      console.error('Error incrementing article views:', err);
    }
  };

  const highlightText = (text: string, term: string): React.ReactNode => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, index) =>
      new RegExp(term, 'i').test(part) ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : part
    );
  };

  // Status color helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen pt-5">
      <div className="mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#083A85]">Help & Support Center</h1>
          <p className="text-gray-600 mt-2">Find answers to your questions or get in touch with our support team.</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle text-red-500 mr-2"></i>
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: 'FAQS', label: 'FAQS', icon: 'bi-question-circle' },
              { key: 'articles', label: 'Articles', icon: 'bi-file-text' },
              { key: 'contact', label: 'Contact', icon: 'bi-envelope' },
              { key: 'tickets', label: 'My Tickets', icon: 'bi-ticket' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveView(tab.key as ViewMode);
                  setCurrentPage(1);
                  setSearchTerm('');
                  setError(null);
                }}
                className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                  activeView === tab.key
                    ? 'bg-[#083A85] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className={`${tab.icon} text-base`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          {activeView !== 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search ${activeView}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm sm:text-base"
                  />
                  <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer text-sm sm:text-base"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer text-sm sm:text-base"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Latest</option>
                  <option value="popularity">Popular</option>
                  <option value="category">Category</option>
                </select>
              </div>
            </div>
          )}

          {/* Results count */}
          {activeView !== 'contact' && !loading && (
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-4 gap-3">
              <p className="text-sm text-gray-600">
                Showing {currentContent.length} of {totalResults} results
              </p>
              {activeView === 'tickets' && (
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="px-4 py-2 w-full sm:w-auto cursor-pointer bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors text-sm"
                >
                  <i className="bi bi-plus mr-2"></i>
                  New Ticket
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85]"></div>
          </div>
        )}

        {/* Content Area */}
        {!loading && (
          <>
            {/* FAQS View */}
            {activeView === 'FAQS' && (
              <div className="space-y-4">
                {currentContent.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <i className="bi bi-question-circle text-6xl text-gray-300"></i>
                    <h3 className="text-xl text-gray-900 mt-4">No FAQS found</h3>
                    <p className="text-gray-600 mt-2">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  (currentContent as FAQ[]).map((faq: FAQ) => (
                    <div key={faq.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                      <button
                        onClick={() => handleFAQClick(faq.id)}
                        className="w-full cursor-pointer p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <h3 className="text-base sm:text-lg text-gray-900 mb-2">
                              {highlightText(faq.question, searchTerm)}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500">
                              <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(faq.priority)}`}>
                                {faq.priority}
                              </span>
                              <span>{faq.category}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>{faq.helpful} helpful votes</span>
                              <span className="hidden sm:inline">•</span>
                              <span>Updated {format(faq.lastUpdated)}</span>
                            </div>
                          </div>
                          <i className={`bi bi-chevron-${openFAQ === faq.id ? 'up' : 'down'} text-gray-700 text-xl`}></i>
                        </div>
                      </button>
                      
                      {openFAQ === faq.id && (
                        <div className="px-4 sm:px-6 pb-6 border-t border-gray-200">
                          <div className="pt-4">
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                              {highlightText(faq.answer, searchTerm)}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {faq.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs sm:text-sm rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 text-sm sm:text-base">
                              <span className="text-gray-600">Was this helpful?</span>
                              <button 
                                onClick={() => handleFAQHelpful(faq.id)}
                                className="flex items-center gap-1 text-green-600 hover:text-green-700"
                              >
                                <i className="bi bi-hand-thumbs-up"></i>
                                Yes
                              </button>
                              <button className="flex items-center gap-1 text-red-600 hover:text-red-700">
                                <i className="bi bi-hand-thumbs-down"></i>
                                No
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Articles View */}
            {activeView === 'articles' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentContent.length === 0 ? (
                  <div className="col-span-full bg-white rounded-lg shadow-sm p-12 text-center">
                    <i className="bi bi-file-text text-6xl text-gray-300"></i>
                    <h3 className="text-xl text-gray-900 mt-4">No articles found</h3>
                    <p className="text-gray-600 mt-2">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  (currentContent as Article[]).map((article: Article) => (
                    <div key={article.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                      <div className="p-6">
                        <h3 className="text-lg text-gray-900 mb-2">
                          {highlightText(article.title, searchTerm)}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {highlightText(article.excerpt || article.content.substring(0, 150) + '...', searchTerm)}
                        </p>
                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-4">
                          <span>{article.category}</span>
                          <div className="flex items-center gap-3">
                            <span><i className="bi bi-clock mr-1"></i>{article.readTime} min read</span>
                            <span><i className="bi bi-eye mr-1"></i>{article.views} views</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleArticleClick(article.id)}
                          className="w-full px-4 py-2 cursor-pointer bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors text-sm"
                        >
                          Read Article
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Contact View */}
            {activeView === 'contact' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <i className="bi bi-envelope text-[#083A85] text-xl"></i>
                      <div>
                        <h3 className="text-gray-900">Email Support</h3>
                        <p className="text-sm text-gray-600">support@jambolush.com</p>
                        <p className="text-xs text-gray-500">Response within 24 hours</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <i className="bi bi-telephone text-[#083A85] text-xl"></i>
                      <div>
                        <h3 className="text-gray-900">Phone Support</h3>
                        <p className="text-sm text-gray-600">+250 788 437 347</p>
                        <p className="text-xs text-gray-500">Mon-Fri, 9 AM - 6 PM EAT</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <i className="bi bi-chat-dots text-[#083A85] text-xl"></i>
                      <div>
                        <h3 className="text-gray-900">Live Chat</h3>
                        <p className="text-sm text-gray-600">Available on website</p>
                        <p className="text-xs text-gray-500">Mon-Fri, 9 AM - 6 PM EAT</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Contact Form</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Subject</label>
                      <input
                        type="text"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm sm:text-base"
                        placeholder="How can we help you?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Category</label>
                      <select
                        value={contactForm.category}
                        onChange={(e) => setContactForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm sm:text-base"
                      >
                        <option>General Inquiry</option>
                        <option>Booking Issue</option>
                        <option>Payment Problem</option>
                        <option>Technical Support</option>
                        <option>Account Help</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Message</label>
                      <textarea
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm sm:text-base"
                        placeholder="Please describe your issue or question..."
                      ></textarea>
                    </div>
                    <button
                      onClick={handleContactSubmit}
                      disabled={!contactForm.subject || !contactForm.message || contactForm.loading}
                      className="w-full px-4 py-2 cursor-pointer bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {contactForm.loading ? (
                        <>
                          <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tickets View */}
            {activeView === 'tickets' && (
              <div className="space-y-4">
                {currentContent.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <i className="bi bi-ticket text-6xl text-gray-300"></i>
                    <h3 className="text-xl text-gray-900 mt-4">No support tickets</h3>
                    <p className="text-gray-600 mt-2">Create your first support ticket to get help</p>
                    <button
                      onClick={() => setShowTicketModal(true)}
                      className="mt-4 px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors"
                    >
                      Create Ticket
                    </button>
                  </div>
                ) : (
                  (currentContent as SupportTicket[]).map((ticket: SupportTicket) => (
                    <div key={ticket.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg text-gray-900">{ticket.subject}</h3>
                            <span className="text-sm text-gray-500">#{ticket.id}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className={`px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                            <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{ticket.category}</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right text-xs text-gray-500 flex-shrink-0 mt-2 sm:mt-0">
                          <p>Created: {format(ticket.createdAt)}</p>
                          <p>Updated: {format(ticket.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && activeView !== 'contact' && (
              <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = (totalPages <= 5 || currentPage <= 3) ? i + 1 : 
                        (currentPage >= totalPages - 2) ? totalPages - 4 + i : currentPage - 2 + i;
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            currentPage === pageNum
                              ? 'bg-[#083A85] text-white'
                              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
                
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl text-gray-900">Create Support Ticket</h2>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="p-2 text-gray-400 cursor-pointer hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <i className="bi bi-x-lg text-lg"></i>
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm sm:text-base"
                    placeholder="Brief description of your issue"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Category</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm sm:text-base"
                    >
                      <option value="general">General</option>
                      <option value="booking">Booking</option>
                      <option value="payment">Payment</option>
                      <option value="technical">Technical</option>
                      <option value="account">Account</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm sm:text-base"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Description *</label>
                  <textarea
                    rows={5}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm sm:text-base"
                    placeholder="Please provide detailed information about your issue..."
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 text-gray-700 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTicketSubmit}
                  disabled={!newTicket.subject || !newTicket.description}
                  className="px-4 py-2 cursor-pointer bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Create Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpSupportCenter;