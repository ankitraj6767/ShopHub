import nodemailer from 'nodemailer';

// Cached transporter for connection pooling
let cachedTransporter = null;
let transporterInitialized = false;

// Create transporter with connection pooling
const getTransporter = () => {
  // Return cached transporter if available
  if (transporterInitialized) {
    return cachedTransporter;
  }
  
  const smtpUser = process.env.SMTP_USER?.trim();
  // Remove spaces from password (Gmail App Passwords are shown with spaces but should be entered without)
  const smtpPassword = process.env.SMTP_PASSWORD?.replace(/\s+/g, '');
  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  
  // Log configuration status once (without exposing credentials)
  console.log('📧 Email Config Initialized:', {
    hasSmtpUser: !!smtpUser,
    hasSmtpPassword: !!smtpPassword,
    passwordLength: smtpPassword?.length,
    smtpHost,
    smtpPort,
    nodeEnv: process.env.NODE_ENV
  });
  
  transporterInitialized = true;
  
  // Use Gmail SMTP if configured
  if (smtpUser && smtpPassword) {
    const isGmail = smtpHost.includes('gmail');
    
    // For Gmail, use service with connection pooling
    if (isGmail) {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        pool: true,           // Enable connection pooling
        maxConnections: 5,    // Max concurrent connections
        maxMessages: 100,     // Max messages per connection
        rateDelta: 1000,      // How often to check rate limit
        rateLimit: 10,        // Max 10 messages per second
      });
    } else {
      cachedTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });
    }
    
    // Verify connection on startup (non-blocking)
    cachedTransporter.verify((error, success) => {
      if (error) {
        console.error('❌ SMTP connection error:', error.message);
        console.error('❌ SMTP error details:', {
          code: error.code,
          command: error.command,
          responseCode: error.responseCode
        });
      } else {
        console.log('✅ SMTP server ready for emails');
      }
    });
    
    return cachedTransporter;
  }

  // Fallback for development without SMTP config
  console.warn('⚠️ SMTP not configured. Emails will be logged to console.');
  return null;
};

// Send email helper
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = getTransporter();
    
    // If no transporter, log email to console (dev fallback)
    if (!transporter) {
      console.log('=== EMAIL (No SMTP configured) ===');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Text:', text || html?.replace(/<[^>]*>/g, '').substring(0, 200) + '...');
      console.log('=================================');
      return { messageId: 'console-log', warning: 'SMTP not configured' };
    }
    
    const fromName = process.env.SMTP_FROM_NAME || 'ShopHub';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]*>/g, ''),
    };

    console.log('📧 Sending email to:', to, '| Subject:', subject);
    
    // Set a timeout for the email sending
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timed out after 30 seconds')), 30000);
    });
    
    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      timeoutPromise
    ]);
    
    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      accepted: info.accepted,
      rejected: info.rejected
    });
    
    return info;
  } catch (error) {
    console.error('❌ Email error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      to: to,
      subject: subject
    });
    throw error;
  }
};

// Email Templates
export const emailTemplates = {
  orderConfirmation: (order, user) => ({
    subject: `Order Confirmation - Order #${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .order-item { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .btn { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Thank you for your order! We're getting it ready to be shipped.</p>
            
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            
            <h3>Items</h3>
            ${order.orderItems.map(item => `
              <div style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
                <div style="flex: 1;">
                  <p style="margin: 0; font-weight: 500;">${item.name}</p>
                  <p style="margin: 5px 0; color: #6b7280;">Qty: ${item.quantity}</p>
                </div>
                <p style="margin: 0; font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            `).join('')}
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
              <p style="display: flex; justify-content: space-between;"><span>Subtotal:</span> <span>$${order.itemsPrice.toFixed(2)}</span></p>
              <p style="display: flex; justify-content: space-between;"><span>Shipping:</span> <span>$${order.shippingPrice.toFixed(2)}</span></p>
              <p style="display: flex; justify-content: space-between;"><span>Tax:</span> <span>$${order.taxPrice.toFixed(2)}</span></p>
              ${order.discount > 0 ? `<p style="display: flex; justify-content: space-between; color: #10b981;"><span>Discount:</span> <span>-$${order.discount.toFixed(2)}</span></p>` : ''}
              <p style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 10px;"><span>Total:</span> <span>$${order.totalPrice.toFixed(2)}</span></p>
            </div>
            
            <h3>Shipping Address</h3>
            <p style="margin: 0;">${order.shippingAddress.fullName}</p>
            <p style="margin: 0;">${order.shippingAddress.address}</p>
            <p style="margin: 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
            <p style="margin: 0;">${order.shippingAddress.country}</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order._id}" class="btn">View Order</a>
            </center>
          </div>
          <div class="footer">
            <p>If you have any questions, reply to this email or contact our support team.</p>
            <p>© ${new Date().getFullYear()} ShopHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  orderShipped: (order, user, trackingNumber) => ({
    subject: `Your Order Has Shipped! - Order #${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .tracking { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e5e7eb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .btn { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Order is On Its Way! 📦</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Great news! Your order has been shipped and is on its way to you.</p>
            
            <div class="tracking">
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
            </div>
            
            <h3>Shipping To</h3>
            <p style="margin: 0;">${order.shippingAddress.fullName}</p>
            <p style="margin: 0;">${order.shippingAddress.address}</p>
            <p style="margin: 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order._id}" class="btn">Track Order</a>
            </center>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ShopHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  orderDelivered: (order, user) => ({
    subject: `Your Order Has Been Delivered! - Order #${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .btn { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Delivered! ✅</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Your order #${order.orderNumber} has been delivered!</p>
            <p>We hope you love your purchase. If you have a moment, we'd really appreciate it if you could leave a review for the products you ordered.</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order._id}" class="btn">Leave a Review</a>
            </center>
          </div>
          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>© ${new Date().getFullYear()} ShopHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  stockAlert: (product, user) => ({
    subject: `${product.name} is Back in Stock!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; text-align: center; }
          .product { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .btn { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Good News! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>The item you've been waiting for is back in stock!</p>
            
            <div class="product">
              <img src="${product.images?.[0]?.url || ''}" alt="${product.name}" style="max-width: 200px; border-radius: 8px;">
              <h3>${product.name}</h3>
              <p style="font-size: 24px; font-weight: bold; color: #4F46E5;">$${product.price.toFixed(2)}</p>
            </div>
            
            <p>Hurry! Stock is limited and items sell out fast.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products/${product._id}" class="btn">Shop Now</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ShopHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  welcomeEmail: (user) => ({
    subject: 'Welcome to ShopHub! 🛒',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .features { display: grid; gap: 15px; margin: 20px 0; }
          .feature { background: white; padding: 15px; border-radius: 8px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .btn { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ShopHub!</h1>
            <p>Your one-stop shop for everything</p>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Thank you for creating an account with ShopHub! We're excited to have you as part of our community.</p>
            
            <h3>What you can do:</h3>
            <div class="features">
              <div class="feature">🛒 Shop thousands of products</div>
              <div class="feature">❤️ Create wishlists and save favorites</div>
              <div class="feature">📦 Track your orders in real-time</div>
              <div class="feature">⭐ Leave reviews and earn rewards</div>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products" class="btn">Start Shopping</a>
            </center>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ShopHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

export default { sendEmail, emailTemplates };
