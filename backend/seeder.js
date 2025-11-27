import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Review from './models/Review.js';

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
    
    // Clear existing data
    await Order.deleteMany();
    await Review.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('Data cleared...');

    // Create users
    const createdUsers = await User.create(users);
    const adminUser = createdUsers[0];

    console.log('Users created...');

    // Add createdBy to products
    const productsWithCreator = products.map((product) => ({
      ...product,
      createdBy: adminUser._id,
    }));

    // Create products
    await Product.create(productsWithCreator);

    console.log('Products created...');

    console.log('Database seeded successfully!');
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
