import SupportTicket from '../models/SupportTicket.js';
import FAQ from '../models/FAQ.js';
import Order from '../models/Order.js';
import { sendEmail } from '../utils/email.js';

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
export const chatbotResponse = async (req, res) => {
  try {
    const { message, context } = req.body;
    const lowerMessage = message.toLowerCase();

    // Simple rule-based responses (can be replaced with AI API)
    let response = '';
    let suggestions = [];

    // Order related
    if (lowerMessage.includes('track') || lowerMessage.includes('order status')) {
      response = "To track your order, go to 'My Orders' in your account. You'll find real-time tracking information and delivery updates there.";
      suggestions = ['How to return an item?', 'Where is my refund?', 'Contact support'];
    }
    // Shipping
    else if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
      response = "We offer free shipping on orders over $100. Standard delivery takes 5-7 business days. Express shipping (2-3 days) is available for an additional fee.";
      suggestions = ['Track my order', 'Shipping to my location', 'Express shipping cost'];
    }
    // Returns
    else if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
      response = "We have a 30-day return policy. To initiate a return, go to your order details and click 'Request Return'. Refunds are processed within 5-7 business days after we receive the item.";
      suggestions = ['Return policy', 'Refund status', 'Exchange item'];
    }
    // Payment
    else if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
      response = "We accept Credit/Debit cards, PayPal, and Cash on Delivery. All transactions are secured with SSL encryption.";
      suggestions = ['Payment failed', 'Add payment method', 'Payment security'];
    }
    // Account
    else if (lowerMessage.includes('account') || lowerMessage.includes('password')) {
      response = "To manage your account, go to 'Profile' from the menu. You can update your password, address, and other details there.";
      suggestions = ['Reset password', 'Update address', 'Delete account'];
    }
    // Greeting
    else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      response = "Hello! 👋 I'm ShopHub Assistant. How can I help you today?";
      suggestions = ['Track order', 'Return item', 'Payment help', 'Contact support'];
    }
    // Contact
    else if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('human') || lowerMessage.includes('agent')) {
      response = "You can reach our support team by creating a support ticket or emailing support@shophub.com. Our team typically responds within 24 hours.";
      suggestions = ['Create ticket', 'Email support', 'FAQ'];
    }
    // Default
    else {
      // Try to find relevant FAQ
      const faqs = await FAQ.find({
        $text: { $search: message },
        isActive: true,
      }).limit(3);

      if (faqs.length > 0) {
        response = faqs[0].answer;
        suggestions = faqs.slice(1).map(f => f.question.substring(0, 50));
      } else {
        response = "I'm not sure I understand. Would you like to speak with a human agent or browse our FAQ?";
        suggestions = ['Contact support', 'View FAQ', 'Track order', 'Return policy'];
      }
    }

    res.json({
      success: true,
      data: {
        message: response,
        suggestions,
        timestamp: new Date(),
      },
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
