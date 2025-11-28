import SupportTicket from '../models/SupportTicket.js';
import FAQ from '../models/FAQ.js';
import Order from '../models/Order.js';
import { sendEmail } from '../utils/email.js';
import { generateAIResponse, getQuickReplies } from '../utils/aiHelper.js';

// ==================== SUPPORT TICKETS ====================

// @desc    Create support ticket
// @route   POST /api/support/tickets
// @access  Private
export const createTicket = async (req, res) => {
  try {
    const { subject, category, message, orderId, priority } = req.body;

    const ticketData = {
      user: req.user._id,
      subject,
      category,
      priority: priority || 'medium',
      messages: [{
        sender: 'user',
        message,
      }],
    };

    if (orderId) {
      const order = await Order.findOne({ _id: orderId, user: req.user._id });
      if (order) {
        ticketData.order = orderId;
      }
    }

    const ticket = await SupportTicket.create(ticketData);
    await ticket.populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's tickets
// @route   GET /api/support/tickets
// @access  Private
export const getMyTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { user: req.user._id };
    if (status) query.status = status;

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('order', 'orderNumber totalPrice');

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get ticket by ID
// @route   GET /api/support/tickets/:id
// @access  Private
export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('order', 'orderNumber totalPrice status')
      .populate('assignedTo', 'name');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check ownership or admin
    if (ticket.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add message to ticket
// @route   POST /api/support/tickets/:id/messages
// @access  Private
export const addMessage = async (req, res) => {
  try {
    const { message } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    const isOwner = ticket.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    ticket.messages.push({
      sender: isAdmin ? 'agent' : 'user',
      message,
    });

    // Update status
    if (isAdmin) {
      ticket.status = 'waiting-customer';
    } else if (ticket.status === 'waiting-customer') {
      ticket.status = 'in-progress';
    }

    await ticket.save();
    await ticket.populate('user', 'name email');

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update ticket status (Admin)
// @route   PUT /api/support/tickets/:id/status
// @access  Private/Admin
export const updateTicketStatus = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    if (status) {
      ticket.status = status;
      if (status === 'resolved') ticket.resolvedAt = new Date();
      if (status === 'closed') ticket.closedAt = new Date();
    }

    if (assignedTo) ticket.assignedTo = assignedTo;

    await ticket.save();
    await ticket.populate(['user', 'assignedTo']);

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all tickets (Admin)
// @route   GET /api/support/admin/tickets
// @access  Private/Admin
export const getAllTickets = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('assignedTo', 'name');

    const total = await SupportTicket.countDocuments(query);

    // Get stats
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: tickets,
      stats: stats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Rate ticket resolution
// @route   POST /api/support/tickets/:id/rate
// @access  Private
export const rateTicket = async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    if (ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!['resolved', 'closed'].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only rate resolved or closed tickets',
      });
    }

    ticket.satisfaction = { rating, feedback };
    await ticket.save();

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== FAQ ====================

// @desc    Get FAQs
// @route   GET /api/support/faqs
// @access  Public
export const getFAQs = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const faqs = await FAQ.find(query)
      .sort({ order: 1, createdAt: -1 })
      .populate('relatedFaqs', 'question');

    // Group by category
    const grouped = faqs.reduce((acc, faq) => {
      if (!acc[faq.category]) acc[faq.category] = [];
      acc[faq.category].push(faq);
      return acc;
    }, {});

    res.json({
      success: true,
      data: category ? faqs : grouped,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Vote FAQ helpful
// @route   POST /api/support/faqs/:id/vote
// @access  Public
export const voteFAQ = async (req, res) => {
  try {
    const { helpful } = req.body;

    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    if (helpful) {
      faq.helpful += 1;
    } else {
      faq.notHelpful += 1;
    }

    await faq.save();

    res.json({
      success: true,
      data: faq,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create FAQ (Admin)
// @route   POST /api/support/admin/faqs
// @access  Private/Admin
export const createFAQ = async (req, res) => {
  try {
    const faq = await FAQ.create(req.body);

    res.status(201).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update FAQ (Admin)
// @route   PUT /api/support/admin/faqs/:id
// @access  Private/Admin
export const updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    res.json({
      success: true,
      data: faq,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete FAQ (Admin)
// @route   DELETE /api/support/admin/faqs/:id
// @access  Private/Admin
export const deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    res.json({
      success: true,
      message: 'FAQ deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== AI CHATBOT ====================

// @desc    AI Chatbot response
// @route   POST /api/support/chat
// @access  Public
// @desc    AI Chatbot Response (Powered by Gemini with context memory)
// @route   POST /api/support/chat
// @access  Public
export const chatbotResponse = async (req, res) => {
  try {
    const { message, context, sessionId } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message',
      });
    }
    
    // Get user ID from auth if available
    const userId = req.user?._id || null;
    
    // Build context with session ID for conversation memory
    const chatContext = {
      ...context,
      sessionId: sessionId || (userId ? userId.toString() : `session-${Date.now()}`)
    };
    
    // Generate AI response with Gemini
    const aiResult = await generateAIResponse(message, userId, chatContext);
    
    res.json({
      success: true,
      data: {
        message: aiResult.response,
        suggestions: aiResult.suggestions,
        actions: aiResult.actions || [],
        relatedProducts: aiResult.relatedProducts || [],
        relatedFaqs: aiResult.relatedFaqs || [],
        sentiment: aiResult.sentiment,
        sessionId: aiResult.sessionId, // Return session ID for client to use in next request
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate response. Please try again.',
    });
  }
};

// @desc    Get quick reply suggestions
// @route   GET /api/support/quick-replies
// @access  Public
export const getQuickReplySuggestions = async (req, res) => {
  try {
    const quickReplies = getQuickReplies();
    res.json({
      success: true,
      data: quickReplies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Assign ticket to admin
// @route   PATCH /api/support/admin/tickets/:id/assign
// @access  Private/Admin
export const assignTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    ticket.assignedTo = req.user._id;
    if (ticket.status === 'open') {
      ticket.status = 'in-progress';
    }
    await ticket.save();
    await ticket.populate('assignedTo', 'name email');

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Close ticket by user
// @route   PATCH /api/support/tickets/:id/close
// @access  Private
export const closeTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check if user owns the ticket
    if (ticket.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    await ticket.save();

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
