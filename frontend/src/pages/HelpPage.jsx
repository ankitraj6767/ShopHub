import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiMessageCircle,
  FiHelpCircle,
  FiFileText,
  FiPhone,
  FiMail,
  FiSend,
  FiChevronDown,
  FiChevronUp,
  FiThumbsUp,
  FiThumbsDown,
  FiPlus,
  FiClock,
  FiPackage,
  FiCreditCard,
  FiTruck,
  FiTag,
  FiUser,
  FiRefreshCw,
  FiArrowRight,
  FiX,
  FiMaximize2,
  FiMinimize2,
  FiExternalLink,
  FiShoppingBag,
  FiCpu,
  FiZap,
  FiStar,
} from 'react-icons/fi';

// Using FiCpu for robot, FiStar for stars, FiZap for lightning as alternatives
import {
  fetchFAQs,
  fetchMyTickets,
  createTicket,
  chatWithAI,
  addChatMessage,
  clearChatMessages,
  voteFAQ,
} from '../store/slices/supportSlice';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const HelpPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { faqs, tickets, chatMessages, chatSessionId, isLoading } = useSelector((state) => state.support);

  const [activeTab, setActiveTab] = useState('chat');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
  });

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Quick reply options
  const quickReplies = [
    { icon: FiPackage, label: 'Track Order', message: 'I want to track my order' },
    { icon: FiRefreshCw, label: 'Returns', message: 'How do I return an item?' },
    { icon: FiCreditCard, label: 'Payment', message: 'What payment methods do you accept?' },
    { icon: FiTruck, label: 'Shipping', message: 'What are your shipping options?' },
    { icon: FiTag, label: 'Coupons', message: 'Are there any active coupons?' },
    { icon: FiUser, label: 'Account', message: 'I need help with my account' },
  ];

  useEffect(() => {
    dispatch(fetchFAQs());
    if (user) {
      dispatch(fetchMyTickets());
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Scroll only within chat container, not the entire page
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  // Add welcome message on first load
  useEffect(() => {
    if (chatMessages.length === 0) {
      dispatch(addChatMessage({
        type: 'bot',
        message: "👋 Hello! I'm **ShopHub AI Assistant**, powered by **Google Gemini AI** with conversation memory.\n\nI can help you with:\n• 📦 Order tracking & shipping\n• ↩️ Returns & refunds\n• 💳 Payment questions\n• 🛍️ Product search\n• 🎟️ Coupons & deals\n\nI remember our conversation, so feel free to ask follow-up questions!\n\nHow can I assist you today?",
        suggestions: ['Show all active coupons', 'Track my order', 'Best sellers', 'Payment help'],
        timestamp: new Date().toISOString(),
      }));
    }
  }, []);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMessage = chatInput.trim();
    setChatInput('');

    // Add user message
    dispatch(addChatMessage({
      type: 'user',
      message: userMessage,
      timestamp: new Date().toISOString(),
    }));

    // Show typing indicator
    setIsTyping(true);

    // Simulate slight delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 300));

    // Get AI response with session ID for context memory
    const result = await dispatch(chatWithAI({ message: userMessage, sessionId: chatSessionId }));
    setIsTyping(false);

    if (chatWithAI.rejected.match(result)) {
      dispatch(addChatMessage({
        type: 'bot',
        message: "I'm having trouble processing your request. Please try again or contact our support team.",
        suggestions: ['Try again', 'Contact support'],
        timestamp: new Date().toISOString(),
      }));
    }

    // Focus back on input
    inputRef.current?.focus();
  };

  const handleQuickReply = (message) => {
    setChatInput(message);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion) => {
    setChatInput(suggestion);
    setTimeout(() => {
      const form = document.getElementById('chat-form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    const result = await dispatch(createTicket(ticketForm));
    if (createTicket.fulfilled.match(result)) {
      toast.success('Ticket created successfully!');
      setTicketForm({ subject: '', category: 'general', priority: 'medium', message: '' });
      setShowTicketForm(false);
    } else {
      toast.error(result.payload || 'Failed to create ticket');
    }
  };

  const handleFaqVote = async (faqId, vote) => {
    await dispatch(voteFAQ({ faqId, vote }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'urgent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(faq);
    return acc;
  }, {});

  // Parse markdown-like formatting
  const formatMessage = (text) => {
    if (!text) return '';
    
    // Split by newlines and process
    return text.split('\n').map((line, i) => {
      // Bold text
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (processedLine.startsWith('• ')) {
        return <div key={i} className="flex items-start ml-2"><span className="mr-2">•</span><span dangerouslySetInnerHTML={{ __html: processedLine.slice(2) }} /></div>;
      }
      // Numbered lists
      const numberedMatch = processedLine.match(/^(\d+)\.\s/);
      if (numberedMatch) {
        return <div key={i} className="flex items-start ml-2"><span className="mr-2 font-medium">{numberedMatch[1]}.</span><span dangerouslySetInnerHTML={{ __html: processedLine.slice(numberedMatch[0].length) }} /></div>;
      }
      // Regular line
      return <div key={i} dangerouslySetInnerHTML={{ __html: processedLine || '&nbsp;' }} />;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <FiCpu className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI-Powered Support Center</h1>
        <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
          <FiStar className="text-yellow-500" />
          Get instant answers with our smart AI assistant
          <FiStar className="text-yellow-500" />
        </p>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setActiveTab('chat')}
          className={`p-6 rounded-xl border-2 text-left transition-all group ${
            activeTab === 'chat' 
              ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30 shadow-md' 
              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
            activeTab === 'chat' ? 'bg-gradient-to-br from-primary-500 to-purple-600' : 'bg-primary-100 dark:bg-primary-900/30'
          }`}>
            <FiCpu className={`w-6 h-6 ${activeTab === 'chat' ? 'text-white' : 'text-primary-600 dark:text-primary-400'}`} />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            AI Assistant
            <FiZap className="text-yellow-500" />
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Smart answers 24/7</p>
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            activeTab === 'faq' 
              ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30 shadow-md' 
              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
            activeTab === 'faq' ? 'bg-gradient-to-br from-primary-500 to-purple-600' : 'bg-primary-100 dark:bg-primary-900/30'
          }`}>
            <FiHelpCircle className={`w-6 h-6 ${activeTab === 'faq' ? 'text-white' : 'text-primary-600 dark:text-primary-400'}`} />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Knowledge Base</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Browse FAQs</p>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            activeTab === 'tickets' 
              ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30 shadow-md' 
              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
            activeTab === 'tickets' ? 'bg-gradient-to-br from-primary-500 to-purple-600' : 'bg-primary-100 dark:bg-primary-900/30'
          }`}>
            <FiFileText className={`w-6 h-6 ${activeTab === 'tickets' ? 'text-white' : 'text-primary-600 dark:text-primary-400'}`} />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Support Tickets</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track requests</p>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            activeTab === 'contact' 
              ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30 shadow-md' 
              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
            activeTab === 'contact' ? 'bg-gradient-to-br from-primary-500 to-purple-600' : 'bg-primary-100 dark:bg-primary-900/30'
          }`}>
            <FiPhone className={`w-6 h-6 ${activeTab === 'contact' ? 'text-white' : 'text-primary-600 dark:text-primary-400'}`} />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Contact Us</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Human support</p>
        </button>
      </div>

      {/* Content Sections */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* AI Chat */}
        {activeTab === 'chat' && (
          <div className={`${isChatExpanded ? 'fixed inset-4 z-50 bg-white rounded-2xl shadow-2xl flex flex-col' : ''}`}>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary-600 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <FiCpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold">ShopHub AI Assistant</h2>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Online • Powered by AI
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsChatExpanded(!isChatExpanded)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {isChatExpanded ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => dispatch(clearChatMessages())}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <FiRefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Replies */}
            {chatMessages.length <= 1 && (
              <div className="p-4 bg-gray-50 border-b">
                <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(item.message)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:border-primary-300 hover:bg-primary-50 transition-all"
                    >
                      <item.icon className="w-4 h-4 text-primary-600" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Window */}
            <div ref={chatContainerRef} className={`${isChatExpanded ? 'flex-1' : 'h-[450px]'} overflow-y-auto p-4 space-y-4 bg-gray-50`}>
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0">
                      <FiCpu className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] ${msg.type === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.type === 'user'
                          ? 'bg-gradient-to-br from-primary-600 to-purple-600 text-white rounded-br-md'
                          : 'bg-white shadow-sm border border-gray-100 rounded-bl-md'
                      }`}
                    >
                      <div className={`text-sm ${msg.type === 'user' ? 'text-white' : 'text-gray-800'}`}>
                        {formatMessage(msg.message)}
                      </div>
                      
                      {/* Actions */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                          {msg.actions.map((action, i) => (
                            <Link
                              key={i}
                              to={action.url}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm hover:bg-primary-100 transition-colors"
                            >
                              {action.label}
                              <FiExternalLink className="w-3 h-3" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && msg.type === 'bot' && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-primary-300 hover:bg-primary-50 transition-all"
                          >
                            {suggestion}
                            <FiArrowRight className="w-3 h-3 ml-1" />
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <p className={`text-xs mt-1 ${msg.type === 'user' ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center ml-2 flex-shrink-0">
                      <FiUser className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mr-2">
                    <FiCpu className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form id="chat-form" onSubmit={handleChatSubmit} className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={isTyping || !chatInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                AI-powered responses • For complex issues, create a support ticket
              </p>
            </form>
          </div>
        )}

        {/* FAQs */}
        {activeTab === 'faq' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FiHelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Knowledge Base</h2>
                <p className="text-gray-600 text-sm">Find answers to common questions</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : Object.keys(groupedFaqs).length === 0 ? (
              <div className="text-center py-12">
                <FiHelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">No FAQs available yet.</p>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="mt-4 btn btn-primary"
                >
                  Ask AI Assistant
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 capitalize">
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      {category.replace('-', ' ')}
                    </h3>
                    <div className="space-y-3">
                      {categoryFaqs.map((faq) => (
                        <div 
                          key={faq._id} 
                          className={`border rounded-xl overflow-hidden transition-all ${
                            expandedFaq === faq._id ? 'border-primary-300 dark:border-primary-600 shadow-md' : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === faq._id ? null : faq._id)}
                            className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.question}</span>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              expandedFaq === faq._id ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                              {expandedFaq === faq._id ? <FiChevronUp /> : <FiChevronDown />}
                            </div>
                          </button>
                          {expandedFaq === faq._id && (
                            <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
                              <p className="text-gray-600 dark:text-gray-300 py-4 leading-relaxed">{faq.answer}</p>
                              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                  <span>Was this helpful?</span>
                                  <button
                                    onClick={() => handleFaqVote(faq._id, 'helpful')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-green-50 hover:text-green-600 transition-colors"
                                  >
                                    <FiThumbsUp /> {faq.helpful || 0}
                                  </button>
                                  <button
                                    onClick={() => handleFaqVote(faq._id, 'notHelpful')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                                  >
                                    <FiThumbsDown /> {faq.notHelpful || 0}
                                  </button>
                                </div>
                                <button
                                  onClick={() => {
                                    setChatInput(`Tell me more about: ${faq.question}`);
                                    setActiveTab('chat');
                                  }}
                                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                >
                                  Ask AI for more details <FiArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Support Tickets */}
        {activeTab === 'tickets' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FiFileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Support Tickets</h2>
                  <p className="text-gray-600 text-sm">Track and manage your requests</p>
                </div>
              </div>
              {user && (
                <button
                  onClick={() => setShowTicketForm(!showTicketForm)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <FiPlus /> New Ticket
                </button>
              )}
            </div>

            {!user ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 mb-4">Please log in to view and create support tickets.</p>
                <Link to="/login" className="btn btn-primary">Log In</Link>
              </div>
            ) : (
              <>
                {/* Ticket Form */}
                {showTicketForm && (
                  <form onSubmit={handleTicketSubmit} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">Create New Ticket</h3>
                      <button
                        type="button"
                        onClick={() => setShowTicketForm(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                        <input
                          type="text"
                          value={ticketForm.subject}
                          onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Brief description of your issue"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={ticketForm.category}
                          onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="order">Order Issue</option>
                          <option value="payment">Payment Issue</option>
                          <option value="shipping">Shipping</option>
                          <option value="returns">Returns & Refunds</option>
                          <option value="product">Product Question</option>
                          <option value="account">Account Issue</option>
                          <option value="technical">Technical Problem</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <div className="flex gap-3">
                          {['low', 'medium', 'high', 'urgent'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setTicketForm({ ...ticketForm, priority: p })}
                              className={`px-4 py-2 rounded-lg capitalize text-sm font-medium transition-all ${
                                ticketForm.priority === p
                                  ? p === 'urgent' ? 'bg-red-500 text-white' :
                                    p === 'high' ? 'bg-orange-500 text-white' :
                                    p === 'medium' ? 'bg-yellow-500 text-white' :
                                    'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                      <textarea
                        value={ticketForm.message}
                        onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 h-32 resize-none"
                        placeholder="Describe your issue in detail..."
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Submit Ticket'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTicketForm(false)}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Tickets List */}
                {tickets.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-500" />
                    <p className="text-gray-600 dark:text-gray-300">No support tickets yet.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a ticket if you need help!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <Link
                        key={ticket._id}
                        to={`/help/ticket/${ticket._id}`}
                        className="block border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">#{ticket.ticketNumber}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                              <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority} priority
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{ticket.subject}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">{ticket.category.replace('-', ' ')}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <FiClock className="w-4 h-4" />
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Contact Us */}
        {activeTab === 'contact' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FiPhone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Contact Us</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Get in touch with our support team</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <FiPhone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Phone Support</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Speak directly with our customer service team for urgent inquiries.
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">1-800-123-4567</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Mon-Fri, 9 AM - 8 PM EST
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                  <FiMail className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                <p className="text-gray-600 mb-4">
                  Send us an email and we'll get back to you within 24 hours.
                </p>
                <a
                  href="mailto:support@shophub.com"
                  className="text-xl font-bold text-green-600 hover:underline"
                >
                  support@shophub.com
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Response time: Within 24 hours
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <FiCpu className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Chat Support</h3>
                <p className="text-gray-600 mb-4">
                  Get instant answers with our smart AI assistant, available 24/7.
                </p>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="btn bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Start Chat
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Available 24/7
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <FiFileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Submit a Ticket</h3>
                <p className="text-gray-600 mb-4">
                  Create a support ticket for detailed assistance with your issue.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('tickets');
                    setShowTicketForm(true);
                  }}
                  className="btn bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Create Ticket
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Track your requests
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/orders" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                  <FiPackage className="w-5 h-5" /> Track Order
                </Link>
                <Link to="/products" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                  <FiShoppingBag className="w-5 h-5" /> Browse Products
                </Link>
                <Link to="/profile" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                  <FiUser className="w-5 h-5" /> My Account
                </Link>
                <button
                  onClick={() => setActiveTab('faq')}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  <FiHelpCircle className="w-5 h-5" /> FAQs
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpPage;
