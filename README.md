# E-Commerce Web Application

A full-stack, production-ready e-commerce web application built with React, Node.js, Express, and MongoDB.

## Features

### 🛒 Core Features
- **Product Catalog** - Browse products with advanced filtering, search, and pagination
- **Shopping Cart** - Persistent cart with quantity management
- **Checkout Flow** - Multi-step checkout with shipping and payment
- **Order Management** - Track orders from placement to delivery
- **Reviews & Ratings** - 5-star rating system with customer reviews

### 👤 User Management
- **Authentication** - Secure JWT-based authentication with refresh tokens
- **User Roles** - Guest, Customer, and Admin roles
- **Profile Management** - Update profile info and change password

### 🔧 Admin Dashboard
- **Dashboard Overview** - Revenue, orders, products, and user statistics
- **Product Management** - Full CRUD operations for products
- **Order Management** - View and update order statuses
- **User Management** - View users and manage roles

### 🔒 Security
- Password hashing with bcrypt
- JWT access & refresh token authentication
- Rate limiting for brute force protection
- Input validation and sanitization
- Secure HTTP-only cookies

## Tech Stack

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (access + refresh tokens)
- **Validation:** express-validator
- **Security:** bcryptjs, express-rate-limit, helmet

### Frontend
- **Framework:** React 18 with Vite
- **State Management:** Redux Toolkit
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Notifications:** react-hot-toast
- **Icons:** react-icons

## Project Structure

```
Ecommerce/
├── backend/
│   ├── config/
│   │   ├── config.js          # Environment configuration
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Auth & token management
│   │   ├── userController.js   # User CRUD operations
│   │   ├── productController.js# Product operations
│   │   ├── orderController.js  # Order management
│   │   └── reviewController.js # Review operations
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   ├── errorMiddleware.js  # Global error handler
│   │   ├── validationMiddleware.js # Input validation
│   │   └── rateLimitMiddleware.js  # Rate limiting
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Product.js         # Product schema
│   │   ├── Order.js           # Order schema
│   │   └── Review.js          # Review schema
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth/*
│   │   ├── userRoutes.js      # /api/users/*
│   │   ├── productRoutes.js   # /api/products/*
│   │   ├── orderRoutes.js     # /api/orders/*
│   │   └── reviewRoutes.js    # /api/reviews/*
│   ├── seeder.js              # Database seeder
│   ├── server.js              # Express app entry
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/        # Layout components
    │   │   ├── routes/        # Route guards
    │   │   └── ui/            # Reusable UI components
    │   ├── pages/
    │   │   ├── admin/         # Admin pages
    │   │   └── *.jsx          # Public pages
    │   ├── store/
    │   │   ├── slices/        # Redux slices
    │   │   └── store.js       # Redux store
    │   ├── utils/
    │   │   ├── api.js         # Axios instance
    │   │   └── helpers.js     # Utility functions
    │   ├── App.jsx            # Main app component
    │   ├── main.jsx           # Entry point
    │   └── index.css          # Global styles
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd Ecommerce
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the backend directory (or use the existing one):
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
   JWT_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Seed the Database** (Optional but recommended)
   ```bash
   npm run seed
   ```
   This creates:
   - Admin user: `admin@example.com` / `admin123`
   - Sample customer: `john@example.com` / `password123`
   - 16 sample products

5. **Start Backend Server**
   ```bash
   npm run dev
   ```
   Backend runs on `http://localhost:5000`

6. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   ```

7. **Start Frontend Development Server**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh` | Refresh access token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get current user profile |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/password` | Change password |
| GET | `/api/users` | Get all users (admin) |
| PUT | `/api/users/:id/role` | Update user role (admin) |
| DELETE | `/api/users/:id` | Delete user (admin) |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products (with filters) |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/my` | Get user's orders |
| GET | `/api/orders/:id` | Get order by ID |
| GET | `/api/orders` | Get all orders (admin) |
| PUT | `/api/orders/:id/status` | Update order status (admin) |
| GET | `/api/orders/stats` | Get order statistics (admin) |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products/:productId/reviews` | Create review |
| GET | `/api/products/:productId/reviews` | Get product reviews |
| PUT | `/api/reviews/:id` | Update review |
| DELETE | `/api/reviews/:id` | Delete review |

## Default Credentials

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Customer | john@example.com | password123 |

## Available Scripts

### Backend
```bash
npm run dev     # Start development server with nodemon
npm start       # Start production server
npm run seed    # Seed database with sample data
npm run seed:destroy  # Remove all data from database
```

### Frontend
```bash
npm run dev     # Start Vite development server
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Run ESLint
```

## Environment Variables

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/ecommerce |
| JWT_SECRET | JWT signing secret | - |
| JWT_REFRESH_SECRET | Refresh token secret | - |
| JWT_EXPIRE | Access token expiry | 15m |
| JWT_REFRESH_EXPIRE | Refresh token expiry | 7d |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:5173 |

## Features Overview

### Product Filtering & Search
- Filter by category, price range, and rating
- Full-text search on product name and description
- Sort by price, rating, or newest
- Pagination with configurable page size

### Cart System
- Add/remove items
- Update quantities
- Persistent across sessions (localStorage)
- Real-time total calculation

### Checkout Flow
1. **Shipping** - Enter delivery address
2. **Payment** - Select payment method (mock payment)
3. **Review** - Confirm order details
4. **Confirmation** - Order success with order details

### Order Tracking
- View order history
- Track order status (Pending → Paid → Shipped → Delivered)
- View detailed order information

### Admin Features
- Dashboard with key metrics
- Product CRUD with image management
- Order status management
- User role management

## License

This project is licensed under the MIT License.
