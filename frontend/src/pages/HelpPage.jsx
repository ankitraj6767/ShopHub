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
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
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
  const { faqs, tickets, chatMessages, isLoading } = useSelector((state) => state.support);

  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    dispatch(fetchFAQs());
    if (user) {
      dispatch(fetchMyTickets());
    }
  }, [dispatch, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Add user message
    dispatch(addChatMessage({
      type: 'user',
      message: chatInput,
      timestamp: new Date().toISOString(),
    }));

    const message = chatInput;
    setChatInput('');

    // Get AI response
    await dispatch(chatWithAI(message));
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
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'urgent':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(faq);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">How can we help you?</h1>
        <p className="text-gray-600">Get answers to your questions or contact our support team</p>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setActiveTab('chat')}
          className={`p-6 rounded-lg border-2 text-left transition-all ${
            activeTab === 'chat' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
          }`}
        >
          <FiMessageCircle className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900">AI Chat Support</h3>
          <p className="text-sm text-gray-600 mt-1">Get instant answers 24/7</p>
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`p-6 rounded-lg border-2 text-left transition-all ${
            activeTab === 'faq' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
          }`}
        >
          <FiHelpCircle className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900">FAQs</h3>
          <p className="text-sm text-gray-600 mt-1">Browse common questions</p>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`p-6 rounded-lg border-2 text-left transition-all ${
            activeTab === 'tickets' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
          }`}
        >
          <FiFileText className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Support Tickets</h3>
          <p className="text-sm text-gray-600 mt-1">Track your requests</p>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`p-6 rounded-lg border-2 text-left transition-all ${
            activeTab === 'contact' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
          }`}
        >
          <FiPhone className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Contact Us</h3>
          <p className="text-sm text-gray-600 mt-1">Speak to our team</p>
        </button>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-lg shadow-md">
        {/* AI Chat */}
        {activeTab === 'chat' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiMessageCircle className="mr-2" /> AI Assistant
            </h2>
            <p className="text-gray-600 mb-4">
              Our AI assistant is available 24/7 to help you with common questions.
            </p>

            {/* Chat Window */}
            <div className="border rounded-lg h-96 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <FiMessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Start a conversation with our AI assistant!</p>
                    <p className="text-sm mt-2">Try asking about orders, returns, shipping, etc.</p>
                  </div>
                )}
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                        msg.type === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p>{msg.message}</p>
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Quick actions:</p>
                          {msg.suggestions.map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => setChatInput(suggestion)}
                              className="text-xs bg-white text-primary-600 px-2 py-1 rounded mr-1 mb-1 hover:bg-primary-50"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="border-t p-3 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 input"
                />
                <button
                  type="submit"
                  disabled={isLoading || !chatInput.trim()}
                  className="btn btn-primary px-4"
                >
                  <FiSend />
                </button>
              </form>
            </div>

            <button
              onClick={() => dispatch(clearChatMessages())}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear conversation
            </button>
          </div>
        )}

        {/* FAQs */}
        {activeTab === 'faq' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiHelpCircle className="mr-2" /> Frequently Asked Questions
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : Object.keys(groupedFaqs).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No FAQs available yet.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
                  <div key={category}>
                    <h3 className="text-lg font-medium text-gray-900 mb-3 capitalize">
                      {category.replace('-', ' ')}
                    </h3>
                    <div className="space-y-2">
                      {categoryFaqs.map((faq) => (
                        <div key={faq._id} className="border rounded-lg">
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === faq._id ? null : faq._id)}
                            className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                          >
                            <span className="font-medium text-gray-900">{faq.question}</span>
                            {expandedFaq === faq._id ? <FiChevronUp /> : <FiChevronDown />}
                          </button>
                          {expandedFaq === faq._id && (
                            <div className="px-4 pb-4">
                              <p className="text-gray-600 mb-3">{faq.answer}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Was this helpful?</span>
                                <button
                                  onClick={() => handleFaqVote(faq._id, 'helpful')}
                                  className="flex items-center gap-1 hover:text-green-600"
                                >
                                  <FiThumbsUp /> {faq.helpful || 0}
                                </button>
                                <button
                                  onClick={() => handleFaqVote(faq._id, 'notHelpful')}
                                  className="flex items-center gap-1 hover:text-red-600"
                                >
                                  <FiThumbsDown /> {faq.notHelpful || 0}
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FiFileText className="mr-2" /> Support Tickets
              </h2>
              {user && (
                <button
                  onClick={() => setShowTicketForm(!showTicketForm)}
                  className="btn btn-primary flex items-center"
                >
                  <FiPlus className="mr-1" /> New Ticket
                </button>
              )}
            </div>

            {!user ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Please log in to view and create support tickets.</p>
                <Link to="/login" className="btn btn-primary">Log In</Link>
              </div>
            ) : (
              <>
                {/* Ticket Form */}
                {showTicketForm && (
                  <form onSubmit={handleTicketSubmit} className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold mb-4">Create New Ticket</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                        <input
                          type="text"
                          value={ticketForm.subject}
                          onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                          className="input w-full"
                          placeholder="Brief description of your issue"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={ticketForm.category}
                          onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                          className="input w-full"
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          value={ticketForm.priority}
                          onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                          className="input w-full"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                      <textarea
                        value={ticketForm.message}
                        onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                        className="input w-full h-32"
                        placeholder="Describe your issue in detail..."
                        required
                      />
                    </div>
                    <div className="flex gap-2">
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
                  <div className="text-center py-8 text-gray-500">
                    <FiFileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No support tickets yet.</p>
                    <p className="text-sm mt-1">Create a ticket if you need help!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <Link
                        key={ticket._id}
                        to={`/help/ticket/${ticket._id}`}
                        className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-gray-500">#{ticket.ticketNumber}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                              <span className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority} priority
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                            <p className="text-sm text-gray-500 mt-1 capitalize">{ticket.category.replace('-', ' ')}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div className="flex items-center">
                              <FiClock className="mr-1" />
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
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiPhone className="mr-2" /> Contact Us
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <FiPhone className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
                <p className="text-gray-600 mb-4">
                  Speak directly with our customer service team for urgent inquiries.
                </p>
                <p className="text-xl font-bold text-primary-600">1-800-123-4567</p>
                <p className="text-sm text-gray-500 mt-2">
                  Available: Mon-Fri, 9 AM - 8 PM EST
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <FiMail className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                <p className="text-gray-600 mb-4">
                  Send us an email and we'll get back to you within 24 hours.
                </p>
                <a
                  href="mailto:support@ecommerce.com"
                  className="text-xl font-bold text-primary-600 hover:underline"
                >
                  support@ecommerce.com
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Response time: Within 24 hours
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <FiMessageCircle className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
                <p className="text-gray-600 mb-4">
                  Chat with our AI assistant or a live agent for quick help.
                </p>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="btn btn-primary"
                >
                  Start Chat
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  AI: 24/7 | Live Agent: Mon-Fri, 9 AM - 6 PM EST
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <FiFileText className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Submit a Ticket</h3>
                <p className="text-gray-600 mb-4">
                  Create a support ticket for detailed assistance with your issue.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('tickets');
                    setShowTicketForm(true);
                  }}
                  className="btn btn-primary"
                >
                  Create Ticket
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Track and manage your support requests
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/orders" className="text-primary-600 hover:underline flex items-center">
                  <FiCheckCircle className="mr-2" /> Track Order
                </Link>
                <Link to="/help" className="text-primary-600 hover:underline flex items-center">
                  <FiHelpCircle className="mr-2" /> Return Policy
                </Link>
                <Link to="/help" className="text-primary-600 hover:underline flex items-center">
                  <FiAlertCircle className="mr-2" /> Shipping Info
                </Link>
                <Link to="/profile" className="text-primary-600 hover:underline flex items-center">
                  <FiMail className="mr-2" /> Account Settings
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpPage;
