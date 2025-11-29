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

const products = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'The latest iPhone with A17 Pro chip, titanium design, and advanced camera system. Features a 6.7-inch Super Retina XDR display with ProMotion technology.',
    price: 1199.99,
    category: 'Electronics',
    brand: 'Apple',
    images: [
      { url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500', alt: 'iPhone 15 Pro Max' },
    ],
    stock: 50,
    featured: true,
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Premium Android smartphone with S Pen, 200MP camera, and Galaxy AI features. Titanium frame with 6.8-inch Dynamic AMOLED display.',
    price: 1299.99,
    category: 'Electronics',
    brand: 'Samsung',
    images: [
      { url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500', alt: 'Samsung Galaxy S24 Ultra' },
    ],
    stock: 35,
    featured: true,
  },
  {
    name: 'MacBook Pro 16"',
    description: 'Powerful laptop with M3 Max chip, 36GB unified memory, and 18-hour battery life. Perfect for professionals and creators.',
    price: 2499.99,
    category: 'Electronics',
    brand: 'Apple',
    images: [
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', alt: 'MacBook Pro' },
    ],
    stock: 25,
    featured: true,
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise canceling wireless headphones with exceptional sound quality and 30-hour battery life.',
    price: 349.99,
    category: 'Electronics',
    brand: 'Sony',
    images: [
      { url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500', alt: 'Sony Headphones' },
    ],
    stock: 100,
    featured: true,
  },
  {
    name: 'Nike Air Max 270',
    description: 'Iconic lifestyle sneaker with the tallest Air unit yet for a super-soft ride that feels as good as it looks.',
    price: 150.00,
    category: 'Clothing',
    brand: 'Nike',
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', alt: 'Nike Air Max' },
    ],
    stock: 75,
    featured: true,
  },
  {
    name: 'Levi\'s 501 Original Jeans',
    description: 'The original blue jean since 1873. Straight leg, button fly, and iconic style that never goes out of fashion.',
    price: 69.99,
    category: 'Clothing',
    brand: 'Levi\'s',
    images: [
      { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', alt: 'Levi\'s Jeans' },
    ],
    stock: 200,
    featured: false,
  },
  {
    name: 'Instant Pot Duo 7-in-1',
    description: 'Multi-use programmable pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and warmer.',
    price: 89.99,
    category: 'Home & Garden',
    brand: 'Instant Pot',
    images: [
      { url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500', alt: 'Instant Pot' },
    ],
    stock: 60,
    featured: true,
  },
  {
    name: 'Dyson V15 Detect',
    description: 'Cordless vacuum with laser dust detection, piezo sensor, and LCD screen showing real-time particle counts.',
    price: 749.99,
    category: 'Home & Garden',
    brand: 'Dyson',
    images: [
      { url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500', alt: 'Dyson Vacuum' },
    ],
    stock: 30,
    featured: true,
  },
  {
    name: 'Atomic Habits',
    description: 'By James Clear. An easy and proven way to build good habits and break bad ones. #1 New York Times bestseller.',
    price: 18.99,
    category: 'Books',
    brand: 'Penguin Random House',
    images: [
      { url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', alt: 'Atomic Habits Book' },
    ],
    stock: 500,
    featured: false,
  },
  {
    name: 'LEGO Star Wars Millennium Falcon',
    description: 'Ultimate Collector Series set with 7,541 pieces. Highly detailed replica of the iconic starship.',
    price: 849.99,
    category: 'Toys & Games',
    brand: 'LEGO',
    images: [
      { url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500', alt: 'LEGO Millennium Falcon' },
    ],
    stock: 15,
    featured: true,
  },
  {
    name: 'Yoga Mat Premium',
    description: 'Extra thick 6mm eco-friendly TPE yoga mat with alignment lines. Non-slip surface for all types of yoga.',
    price: 45.99,
    category: 'Sports & Outdoors',
    brand: 'Manduka',
    images: [
      { url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500', alt: 'Yoga Mat' },
    ],
    stock: 150,
    featured: false,
  },
  {
    name: 'The Ordinary Skincare Set',
    description: 'Complete skincare routine including Niacinamide, Hyaluronic Acid, and Natural Moisturizing Factors.',
    price: 35.99,
    category: 'Health & Beauty',
    brand: 'The Ordinary',
    images: [
      { url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500', alt: 'Skincare Set' },
    ],
    stock: 80,
    featured: false,
  },
  {
    name: 'PlayStation 5',
    description: 'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with haptic feedback, and a new generation of incredible PlayStation games.',
    price: 499.99,
    category: 'Electronics',
    brand: 'Sony',
    images: [
      { url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500', alt: 'PlayStation 5' },
    ],
    stock: 20,
    featured: true,
  },
  {
    name: 'Nintendo Switch OLED',
    description: '7-inch OLED screen, wide adjustable stand, dock with wired LAN port, 64GB internal storage, and enhanced audio.',
    price: 349.99,
    category: 'Electronics',
    brand: 'Nintendo',
    images: [
      { url: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500', alt: 'Nintendo Switch' },
    ],
    stock: 45,
    featured: true,
  },
  {
    name: 'Patagonia Better Sweater',
    description: 'Fair Trade Certified sewn sweater-knit fleece jacket made with 100% recycled polyester.',
    price: 139.00,
    category: 'Clothing',
    brand: 'Patagonia',
    images: [
      { url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', alt: 'Patagonia Sweater' },
    ],
    stock: 65,
    featured: false,
  },
  {
    name: 'KitchenAid Stand Mixer',
    description: 'Iconic tilt-head stand mixer with 10 speeds and 5-quart stainless steel bowl. Includes flat beater, dough hook, and wire whip.',
    price: 379.99,
    category: 'Home & Garden',
    brand: 'KitchenAid',
    images: [
      { url: 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=500', alt: 'KitchenAid Mixer' },
    ],
    stock: 40,
    featured: false,
  },
];

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

    // Add products only if they don't exist
    for (const productData of products) {
      const existingProduct = await Product.findOne({ name: productData.name });
      if (!existingProduct) {
        await Product.create({
          ...productData,
          createdBy: adminUser._id,
        });
        console.log(`Product "${productData.name}" created...`);
      } else {
        console.log(`Product "${productData.name}" already exists, skipping...`);
      }
    }

    console.log('Products check completed...');

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
