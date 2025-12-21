import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  text: {
    type: String,
    required: [true, 'Testimonial text is required'],
    trim: true,
    minlength: [20, 'Testimonial must be at least 20 characters'],
    maxlength: [500, 'Testimonial cannot exceed 500 characters']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  productName: {
    type: String,
    trim: true,
    default: ''
  },
  orderReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
testimonialSchema.index({ status: 1, createdAt: -1 });
testimonialSchema.index({ user: 1 });
testimonialSchema.index({ isFeatured: 1, status: 1 });
testimonialSchema.index({ rating: 1 });

// Virtual for user info (populated)
testimonialSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Static method to get approved testimonials
testimonialSchema.statics.getApproved = function(limit = 10) {
  return this.find({ status: 'approved' })
    .populate('user', 'name avatar')
    .populate('product', 'name images')
    .sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 })
    .limit(limit);
};

// Static method to get featured testimonials
testimonialSchema.statics.getFeatured = function(limit = 5) {
  return this.find({ status: 'approved', isFeatured: true })
    .populate('user', 'name avatar')
    .populate('product', 'name images')
    .sort({ displayOrder: 1, createdAt: -1 })
    .limit(limit);
};

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

export default Testimonial;
