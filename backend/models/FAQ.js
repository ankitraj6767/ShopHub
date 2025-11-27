import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Please add a question'],
      maxlength: [500, 'Question cannot exceed 500 characters'],
    },
    answer: {
      type: String,
      required: [true, 'Please add an answer'],
    },
    category: {
      type: String,
      enum: ['orders', 'shipping', 'returns', 'payments', 'account', 'products', 'general'],
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    notHelpful: {
      type: Number,
      default: 0,
    },
    relatedFaqs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FAQ',
    }],
    keywords: [String],
  },
  {
    timestamps: true,
  }
);

// Text index for search
faqSchema.index({ question: 'text', answer: 'text', keywords: 'text' });

const FAQ = mongoose.model('FAQ', faqSchema);
export default FAQ;
