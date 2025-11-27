import Stripe from 'stripe';
import Order from '../models/Order.js';
import config from '../config/config.js';
import { sendEmail, emailTemplates } from '../utils/email.js';

const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment system not configured',
      });
    }

    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with payment intent ID
    order.paymentInfo.transactionId = paymentIntent.id;
    await order.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const order = await Order.findById(orderId).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Verify payment with Stripe
    if (stripe && paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        order.paymentInfo.status = 'paid';
        order.paymentInfo.paidAt = new Date();
        order.paymentInfo.transactionId = paymentIntentId;
        order.status = 'Confirmed';
        order.addStatusHistory('Confirmed', req.user._id, 'Payment received');
        
        await order.save();

        // Send confirmation email
        try {
          const emailData = emailTemplates.orderConfirmation(order, order.user);
          await sendEmail({
            to: order.user.email,
            subject: emailData.subject,
            html: emailData.html,
          });
        } catch (emailError) {
          console.error('Failed to send order confirmation email:', emailError);
        }

        return res.json({
          success: true,
          message: 'Payment confirmed',
          order,
        });
      }
    }

    // For COD or demo mode
    if (order.paymentInfo.method === 'Cash on Delivery') {
      order.status = 'Confirmed';
      order.addStatusHistory('Confirmed', req.user._id, 'Order confirmed - Cash on Delivery');
      await order.save();

      return res.json({
        success: true,
        message: 'Order confirmed',
        order,
      });
    }

    res.status(400).json({
      success: false,
      message: 'Payment not confirmed',
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public
export const stripeWebhook = async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ message: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripeWebhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handlePaymentFailure(failedPayment);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Handle successful payment
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const order = await Order.findOne({
      'paymentInfo.transactionId': paymentIntent.id,
    }).populate('user', 'name email');

    if (order && order.paymentInfo.status !== 'paid') {
      order.paymentInfo.status = 'paid';
      order.paymentInfo.paidAt = new Date();
      order.status = 'Confirmed';
      order.addStatusHistory('Confirmed', null, 'Payment received via Stripe');
      await order.save();

      // Send confirmation email
      try {
        const emailData = emailTemplates.orderConfirmation(order, order.user);
        await sendEmail({
          to: order.user.email,
          subject: emailData.subject,
          html: emailData.html,
        });
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
      }
    }
  } catch (error) {
    console.error('Handle payment success error:', error);
  }
};

// Handle failed payment
const handlePaymentFailure = async (paymentIntent) => {
  try {
    const order = await Order.findOne({
      'paymentInfo.transactionId': paymentIntent.id,
    });

    if (order) {
      order.paymentInfo.status = 'failed';
      order.addStatusHistory('Pending', null, 'Payment failed');
      await order.save();
    }
  } catch (error) {
    console.error('Handle payment failure error:', error);
  }
};

// @desc    Get Stripe publishable key
// @route   GET /api/payments/config
// @access  Public
export const getPaymentConfig = async (req, res) => {
  res.json({
    success: true,
    publishableKey: config.stripePublishableKey || null,
    stripeEnabled: !!config.stripeSecretKey,
  });
};

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private/Admin
export const processRefund = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment system not configured',
      });
    }

    const { orderId, amount, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.paymentInfo.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order has not been paid',
      });
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentInfo.transactionId,
      amount: amount ? Math.round(amount * 100) : undefined, // Full refund if no amount specified
      reason: reason || 'requested_by_customer',
    });

    // Update order
    order.paymentInfo.status = amount && amount < order.totalPrice ? 'partial_refund' : 'refunded';
    order.paymentInfo.refundedAmount = (order.paymentInfo.refundedAmount || 0) + (amount || order.totalPrice);
    order.paymentInfo.refundedAt = new Date();
    order.addStatusHistory('Returned', req.user._id, `Refund processed: $${amount || order.totalPrice}`);
    
    await order.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund,
      order,
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
