import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Review from './models/Review.js';
import Coupon from './models/Coupon.js';
import FAQ from './models/FAQ.js';
import Notification from './models/Notification.js';

dotenv.config();

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    phone: '555-0100',
    address: {
      street: '123 Admin St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    },
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'john123',
    role: 'customer',
    phone: '555-0101',
    address: {
      street: '456 Main St',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'USA',
    },
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'jane123',
    role: 'customer',
    phone: '555-0102',
    address: {
      street: '789 Oak Ave',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'USA',
    },
  },
];

// Products array removed - add products manually through admin panel

const seedDatabase = async () => {
  try {
    await connectDB();

    // Check for existing admin user or create one
    let adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      // Create admin user only if doesn't exist
      adminUser = await User.create(users[0]);
      console.log('Admin user created...');
    } else {
      console.log('Admin user already exists, skipping...');
    }

    // Create other users only if they don't exist
    for (let i = 1; i < users.length; i++) {
      const existingUser = await User.findOne({ email: users[i].email });
      if (!existingUser) {
        await User.create(users[i]);
        console.log(`User ${users[i].email} created...`);
      } else {
        console.log(`User ${users[i].email} already exists, skipping...`);
      }
    }

    // Products are now added manually through admin panel
    console.log('Products seeding skipped - add products manually through admin panel...');

    // Create sample coupons
    const coupons = [
      {
        code: 'WELCOME10',
        description: 'Welcome discount - 10% off for new customers',
        discountType: 'percentage',
        discountValue: 10,
        minimumPurchase: 50,
        usageLimit: 100,
        usageCount: 0,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        isActive: true,
        createdBy: adminUser._id,
      },
      {
        code: 'FLAT20',
        description: 'Flat ₹20 off on orders above ₹100',
        discountType: 'fixed',
        discountValue: 20,
        minimumPurchase: 100,
        usageLimit: 50,
        usageCount: 0,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        isActive: true,
        createdBy: adminUser._id,
      },
      {
        code: 'SUMMER25',
        description: 'Summer sale - 25% off on orders above ₹200',
        discountType: 'percentage',
        discountValue: 25,
        minimumPurchase: 200,
        maximumDiscount: 100,
        usageLimit: 30,
        usageCount: 0,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
        createdBy: adminUser._id,
      },
    ];

    // Add coupons only if they don't exist
    for (const couponData of coupons) {
      const existingCoupon = await Coupon.findOne({ code: couponData.code });
      if (!existingCoupon) {
        await Coupon.create(couponData);
        console.log(`Coupon "${couponData.code}" created...`);
      } else {
        console.log(`Coupon "${couponData.code}" already exists, skipping...`);
      }
    }

    console.log('Coupons check completed...');

    // Add sample FAQs
    const faqs = [
      {
        question: 'How do I track my order?',
        answer: 'You can track your order by going to "My Orders" in your account. Click on any order to see its current status and tracking information. You will also receive email updates about your order status.',
        category: 'orders',
        order: 1,
        isActive: true,
      },
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for most items. Products must be unused and in original packaging. To initiate a return, go to your order details and click "Return Item". Refunds are processed within 5-7 business days after we receive the returned item.',
        category: 'orders',
        order: 2,
        isActive: true,
      },
      {
        question: 'How can I cancel my order?',
        answer: 'You can cancel your order within 24 hours of placing it, as long as it hasn\'t been shipped yet. Go to "My Orders", find your order, and click "Cancel Order". If the order has already shipped, you\'ll need to wait and return it instead.',
        category: 'orders',
        order: 3,
        isActive: true,
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and secure payments through Stripe. All payments are encrypted and processed securely.',
        category: 'payments',
        order: 1,
        isActive: true,
      },
      {
        question: 'Is my payment information secure?',
        answer: 'Yes, absolutely! We use Stripe for payment processing, which is PCI-DSS compliant. Your card details are never stored on our servers - they are encrypted and handled directly by Stripe.',
        category: 'payments',
        order: 2,
        isActive: true,
      },
      {
        question: 'How do I apply a coupon code?',
        answer: 'During checkout, you\'ll see a "Promo Code" field in the order summary. Enter your coupon code and click "Apply". The discount will be automatically calculated and shown in your total.',
        category: 'payments',
        order: 3,
        isActive: true,
      },
      {
        question: 'How long does shipping take?',
        answer: 'Standard shipping typically takes 5-7 business days. Express shipping (2-3 days) is available for an additional fee. You can see estimated delivery dates at checkout based on your location.',
        category: 'shipping',
        order: 1,
        isActive: true,
      },
      {
        question: 'Do you ship internationally?',
        answer: 'Currently, we ship to the United States and Canada. International shipping to other countries will be available soon. Sign up for our newsletter to be notified when we expand.',
        category: 'shipping',
        order: 2,
        isActive: true,
      },
      {
        question: 'How do I reset my password?',
        answer: 'Click on "Forgot Password" on the login page and enter your email address. We\'ll send you a link to reset your password. The link expires in 1 hour for security reasons.',
        category: 'account',
        order: 1,
        isActive: true,
      },
      {
        question: 'How do I update my account information?',
        answer: 'Go to your Profile page by clicking on your name in the top right corner. Here you can update your name, email, password, phone number, and shipping address.',
        category: 'account',
        order: 2,
        isActive: true,
      },
      {
        question: 'How do I contact customer support?',
        answer: 'You can reach us through: 1) Live chat on this help page, 2) Create a support ticket, 3) Email us at support@shophub.com, or 4) Call us at 1-800-SHOPHUB. Our support team is available 24/7.',
        category: 'general',
        order: 1,
        isActive: true,
      },
    ];

    for (const faqData of faqs) {
      const existingFaq = await FAQ.findOne({ question: faqData.question });
      if (!existingFaq) {
        await FAQ.create(faqData);
        console.log(`FAQ "${faqData.question.substring(0, 30)}..." created...`);
      } else {
        console.log(`FAQ "${faqData.question.substring(0, 30)}..." already exists, skipping...`);
      }
    }

    console.log('FAQs check completed...');

    // Seed sample notifications for John
    console.log('\nChecking notifications...');
    const johnUser = await User.findOne({ email: 'john@example.com' });
    if (johnUser) {
      const existingNotifications = await Notification.countDocuments({ user: johnUser._id });
      if (existingNotifications === 0) {
        const notifications = [
          {
            user: johnUser._id,
            type: 'promo',
            title: 'Welcome to ShopHub! 🎉',
            message: 'Thanks for joining us! Use code WELCOME10 to get 10% off your first order.',
            link: '/products',
            read: false,
          },
          {
            user: johnUser._id,
            type: 'delivery',
            title: 'Fast Delivery Available',
            message: 'Express delivery is now available in your area. Get your orders in 2-3 days!',
            link: '/products',
            read: false,
          },
          {
            user: johnUser._id,
            type: 'system',
            title: 'Complete Your Profile',
            message: 'Add your phone number to receive order updates via SMS.',
            link: '/profile',
            read: true,
          },
        ];

        for (const notif of notifications) {
          await Notification.create(notif);
        }
        console.log('Sample notifications created for John...');
      } else {
        console.log('Notifications already exist, skipping...');
      }
    }

    console.log('\nDatabase seeding completed successfully!');
    console.log('\nTest Accounts:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Customer: john@example.com / john123');
    console.log('Customer: jane@example.com / jane123');

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    
    await Order.deleteMany();
    await Review.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Coupon.deleteMany();

    console.log('Data destroyed!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  seedDatabase();
}
