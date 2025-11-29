import FAQ from '../models/FAQ.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';

// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyD4ECBOjto5nnvXBQg0yCkWQXKxfWcfqHs';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Store conversation history per user session (in-memory, can be replaced with Redis/DB)
const conversationHistory = new Map();
const MAX_HISTORY_LENGTH = 20;

// Get or create conversation history for a session
const getConversationHistory = (sessionId) => {
  if (!conversationHistory.has(sessionId)) {
    conversationHistory.set(sessionId, []);
  }
  return conversationHistory.get(sessionId);
};

// Add message to conversation history
const addToHistory = (sessionId, role, content) => {
  const history = getConversationHistory(sessionId);
  history.push({ role, content, timestamp: new Date() });
  
  // Keep only last N messages to prevent context overflow
  if (history.length > MAX_HISTORY_LENGTH) {
    history.splice(0, history.length - MAX_HISTORY_LENGTH);
  }
};

// Clear conversation history
export const clearConversationHistory = (sessionId) => {
  conversationHistory.delete(sessionId);
};

// Fetch real-time store data
const fetchStoreContext = async (userId = null) => {
  const context = {};
  
  try {
    // Get all active coupons
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now }
    }).select('code description discountType discountValue minimumPurchase maximumDiscount validUntil');
    
    context.coupons = coupons.map(c => ({
      code: c.code,
      description: c.description,
      discount: c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`,
      minPurchase: c.minimumPurchase || 0,
      maxDiscount: c.maximumDiscount,
      expiresAt: c.validUntil
    }));
    
    // Get product statistics
    const totalProducts = await Product.countDocuments({ isActive: true });
    const categories = await Product.distinct('category', { isActive: true });
    const brands = await Product.distinct('brand', { isActive: true });
    
    context.store = {
      totalProducts,
      categories,
      brands,
      totalCategories: categories.length,
      totalBrands: brands.length
    };
    
    // Get ALL products for comprehensive knowledge (limit to 100 for performance)
    const allProducts = await Product.find({ isActive: true })
      .limit(100)
      .select('name price category brand stock rating salePrice isOnSale description');
    context.allProducts = allProducts.map(p => ({
      name: p.name,
      price: p.isOnSale && p.salePrice ? p.salePrice : p.price,
      originalPrice: p.price,
      category: p.category,
      brand: p.brand,
      stock: p.stock,
      rating: p.rating,
      isOnSale: p.isOnSale,
      inStock: p.stock > 0
    }));
    
    // Get featured products
    const featuredProducts = await Product.find({ isActive: true, featured: true })
      .limit(10)
      .select('name price category brand stock rating');
    context.featuredProducts = featuredProducts;
    
    // Get low stock products
    const lowStockProducts = await Product.find({ isActive: true, stock: { $lte: 10, $gt: 0 } })
      .limit(5)
      .select('name price stock');
    context.lowStockProducts = lowStockProducts;
    
    // Get user-specific data if logged in
    if (userId) {
      const orders = await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber status totalPrice createdAt items shippingAddress');
      
      context.userOrders = orders.map(o => ({
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.totalPrice,
        date: o.createdAt,
        itemCount: o.items?.length || 0
      }));
      
      const user = await User.findById(userId).select('name email');
      context.userName = user?.name;
    }
    
  } catch (error) {
    console.error('Error fetching store context:', error);
  }
  
  return context;
};

// Search products based on query
const searchProducts = async (query) => {
  try {
    // Split query into words for more flexible matching
    const words = query.split(/\s+/).filter(w => w.length > 2);
    
    // Create regex patterns for each word
    const regexPatterns = words.map(word => ({
      $or: [
        { name: { $regex: word, $options: 'i' } },
        { brand: { $regex: word, $options: 'i' } },
        { category: { $regex: word, $options: 'i' } },
        { description: { $regex: word, $options: 'i' } }
      ]
    }));
    
    // Search with full query first
    let products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    }).limit(10).select('name price salePrice isOnSale category brand stock rating images');
    
    // If no results, try individual words
    if (products.length === 0 && words.length > 0) {
      products = await Product.find({
        $and: [
          { isActive: true },
          { $or: regexPatterns.flatMap(p => p.$or) }
        ]
      }).limit(10).select('name price salePrice isOnSale category brand stock rating images');
    }
    
    return products;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

// Search FAQs
const searchFAQs = async (query) => {
  try {
    let faqs = await FAQ.find({
      $or: [
        { question: { $regex: query, $options: 'i' } },
        { answer: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    }).limit(5);
    
    return faqs;
  } catch (error) {
    return [];
  }
};

// Build system prompt with real-time context
const buildSystemPrompt = (storeContext, conversationHistory) => {
  let systemPrompt = `You are ShopHub AI Assistant, a helpful and friendly customer support chatbot for an e-commerce store called ShopHub.

Your personality:
- Friendly, professional, and helpful
- Use emojis appropriately to make conversations engaging
- Be concise but thorough
- Always provide accurate information based on the real data provided

IMPORTANT RULES:
1. Only provide information based on the REAL DATA given below
2. If asked about coupons, list ALL available coupons from the data
3. If asked about products, ALWAYS check the COMPLETE PRODUCT LIST below for the product
4. If asked about product price, availability, or details - SEARCH the product list below
5. If asked about orders, use the user's real order data
6. Never make up information - if you don't find a product, say it's not in our catalog
7. Format responses nicely with bullet points and sections
8. Remember the conversation context and refer back to previous messages when relevant
9. When user mentions ANY product name, look it up in the product list below
10. Prices shown are in USD ($)

CURRENT STORE DATA:
`;

  // Add coupon data
  if (storeContext.coupons && storeContext.coupons.length > 0) {
    systemPrompt += `\n📎 ACTIVE COUPONS (${storeContext.coupons.length} total):\n`;
    storeContext.coupons.forEach((c, i) => {
      systemPrompt += `${i + 1}. Code: "${c.code}" - ${c.discount} OFF`;
      if (c.description) systemPrompt += ` - ${c.description}`;
      if (c.minPurchase > 0) systemPrompt += ` (Min: $${c.minPurchase})`;
      if (c.maxDiscount) systemPrompt += ` (Max: $${c.maxDiscount})`;
      systemPrompt += ` | Expires: ${new Date(c.expiresAt).toLocaleDateString()}`;
      systemPrompt += `\n`;
    });
  } else {
    systemPrompt += '\n📎 COUPONS: No active coupons currently available.\n';
  }

  // Add store stats
  if (storeContext.store) {
    systemPrompt += `\n🏪 STORE INFO:\n`;
    systemPrompt += `- Total Products: ${storeContext.store.totalProducts}\n`;
    systemPrompt += `- Categories: ${storeContext.store.categories.join(', ')}\n`;
    systemPrompt += `- Brands: ${storeContext.store.brands.slice(0, 15).join(', ')}${storeContext.store.brands.length > 15 ? '...' : ''}\n`;
  }

  // Add ALL products for comprehensive knowledge
  if (storeContext.allProducts && storeContext.allProducts.length > 0) {
    systemPrompt += `\n📦 COMPLETE PRODUCT CATALOG (${storeContext.allProducts.length} products):\n`;
    systemPrompt += `USE THIS LIST TO ANSWER ANY PRODUCT QUESTIONS:\n`;
    storeContext.allProducts.forEach((p, i) => {
      systemPrompt += `${i + 1}. "${p.name}" - Price: ₹${p.price}`;
      if (p.isOnSale && p.originalPrice !== p.price) {
        systemPrompt += ` (Was: ₹${p.originalPrice}, ON SALE!)`;
      }
      systemPrompt += ` | Category: ${p.category} | Brand: ${p.brand}`;
      systemPrompt += ` | ${p.inStock ? `In Stock (${p.stock} available)` : 'OUT OF STOCK'}`;
      if (p.rating) systemPrompt += ` | Rating: ${p.rating}/5`;
      systemPrompt += `\n`;
    });
  }

  // Add featured products
  if (storeContext.featuredProducts && storeContext.featuredProducts.length > 0) {
    systemPrompt += `\n⭐ FEATURED PRODUCTS:\n`;
    storeContext.featuredProducts.forEach((p, i) => {
      systemPrompt += `${i + 1}. ${p.name} - ₹${p.price} (${p.category}, ${p.brand}) - Stock: ${p.stock}\n`;
    });
  }

  // Add search results if any
  if (storeContext.searchResults && storeContext.searchResults.length > 0) {
    systemPrompt += `\n🔍 SEARCH RESULTS (matching user query):\n`;
    storeContext.searchResults.forEach((p, i) => {
      systemPrompt += `${i + 1}. ${p.name} - ₹${p.price} (${p.category}, ${p.brand}) - ${p.inStock ? `In Stock (${p.stock})` : 'Out of Stock'}\n`;
    });
  }

  // Add user context
  if (storeContext.userName) {
    systemPrompt += `\n👤 CUSTOMER: ${storeContext.userName}\n`;
  }

  if (storeContext.userOrders && storeContext.userOrders.length > 0) {
    systemPrompt += `\n📦 CUSTOMER'S RECENT ORDERS:\n`;
    storeContext.userOrders.forEach((o, i) => {
      systemPrompt += `${i + 1}. Order #${o.orderNumber} - Status: ${o.status.toUpperCase()} - ₹${o.total.toFixed(2)} (${o.itemCount} items) - Date: ${new Date(o.date).toLocaleDateString()}\n`;
    });
  }

  // Add conversation history summary
  if (conversationHistory && conversationHistory.length > 0) {
    systemPrompt += `\n💬 CONVERSATION CONTEXT:\n`;
    systemPrompt += `This is an ongoing conversation. The user has asked ${conversationHistory.length} previous messages. Remember and reference previous context when answering.\n`;
  }

  systemPrompt += `\n---\nRespond helpfully based on the above real data. Format your responses nicely with markdown-style formatting (use ** for bold, bullet points •, numbered lists, etc). Always be accurate and helpful!`;

  return systemPrompt;
};

// Call Gemini API
const callGeminiAPI = async (userMessage, systemPrompt, conversationHistory) => {
  try {
    console.log('🤖 Calling Gemini API...');
    console.log('📝 User message:', userMessage);
    
    // Build conversation for Gemini
    const contents = [];
    
    // Add system prompt as first user message context
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt + '\n\n---\nNow respond to the user. Remember all previous context.' }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'I understand! I have access to the real store data and will provide accurate, helpful responses. I\'ll remember our conversation context. How can I help you?' }]
    });
    
    // Add conversation history (last 10 messages for context)
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }
    
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    console.log('📤 Sending request to Gemini with', contents.length, 'messages');

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });

    console.log('📥 Gemini API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API error:', JSON.stringify(errorData, null, 2));
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ Gemini API response received');
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const responseText = data.candidates[0].content.parts[0].text;
      console.log('📩 Gemini response:', responseText.substring(0, 100) + '...');
      return responseText;
    }
    
    console.error('❌ No valid response from Gemini:', JSON.stringify(data, null, 2));
    throw new Error('No response from Gemini');
  } catch (error) {
    console.error('❌ Gemini API call failed:', error.message);
    return null;
  }
};

// Generate smart suggestions based on context
const generateSuggestions = (message, storeContext) => {
  const lowerMessage = message.toLowerCase();
  const suggestions = [];
  
  if (lowerMessage.includes('coupon') || lowerMessage.includes('discount')) {
    suggestions.push('How to apply coupon?', 'Best deals today');
  } else if (lowerMessage.includes('order') || lowerMessage.includes('track')) {
    suggestions.push('Track my order', 'Order history', 'Return an item');
  } else if (lowerMessage.includes('product') || lowerMessage.includes('buy')) {
    suggestions.push('Best sellers', 'New arrivals', 'Browse categories');
  } else if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
    suggestions.push('Shipping cost', 'Express delivery', 'Track package');
  } else if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
    suggestions.push('Return policy', 'Start a return', 'Refund status');
  } else {
    // Default suggestions
    if (storeContext.coupons?.length > 0) {
      suggestions.push('Active coupons');
    }
    suggestions.push('Track my order', 'Browse products');
  }
  
  suggestions.push('Contact support');
  return [...new Set(suggestions)].slice(0, 4);
};

// Analyze sentiment
const analyzeSentiment = (message) => {
  const lowerMessage = message.toLowerCase();
  
  const positiveWords = ['thank', 'great', 'good', 'love', 'excellent', 'amazing', 'happy', 'perfect', 'helpful', 'awesome'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'angry', 'frustrated', 'disappointed', 'worst', 'never', 'problem', 'issue', 'broken', 'damaged', 'hate'];
  const urgentWords = ['urgent', 'asap', 'immediately', 'now', 'emergency', 'help me', 'please help', 'stuck'];
  
  let positiveScore = positiveWords.filter(w => lowerMessage.includes(w)).length;
  let negativeScore = negativeWords.filter(w => lowerMessage.includes(w)).length;
  let urgency = urgentWords.filter(w => lowerMessage.includes(w)).length;
  
  return {
    sentiment: positiveScore > negativeScore ? 'positive' : negativeScore > positiveScore ? 'negative' : 'neutral',
    urgency: urgency > 0,
    needsHuman: negativeScore >= 2 || urgency > 0
  };
};

// Main AI response generator with Gemini
export const generateAIResponse = async (message, userId = null, context = {}) => {
  console.log('🚀 generateAIResponse called');
  console.log('📝 Message:', message);
  console.log('👤 UserId:', userId);
  console.log('🔑 SessionId:', context.sessionId);
  
  const sessionId = context.sessionId || userId || 'anonymous-' + Date.now();
  
  // Get conversation history
  const history = getConversationHistory(sessionId);
  console.log('📚 Conversation history length:', history.length);
  
  // Fetch real-time store context
  console.log('🏪 Fetching store context...');
  const storeContext = await fetchStoreContext(userId);
  console.log('📦 Store context loaded:', {
    coupons: storeContext.coupons?.length || 0,
    products: storeContext.store?.totalProducts || 0,
    userOrders: storeContext.userOrders?.length || 0
  });
  
  // Analyze sentiment
  const sentiment = analyzeSentiment(message);
  
  // Check if user is asking about specific products - be more aggressive with searching
  const lowerMessage = message.toLowerCase();
  let searchedProducts = [];
  
  // Keywords that indicate product inquiry
  const productKeywords = ['price', 'cost', 'how much', 'available', 'stock', 'buy', 'purchase', 
                          'search', 'find', 'looking for', 'show me', 'tell me about', 'what is',
                          'do you have', 'is there', 'where can i find', 'details', 'information'];
  
  const isProductQuery = productKeywords.some(kw => lowerMessage.includes(kw)) || 
                        storeContext.allProducts?.some(p => lowerMessage.includes(p.name.toLowerCase()));
  
  if (isProductQuery) {
    // Extract potential product name from message
    // Remove common words to get the product name
    let searchQuery = message
      .replace(/what is the|tell me|price of|cost of|how much is|do you have|is there|where can i find|show me|find|search|looking for|i want|i need|details about|information about|about|the|a|an|please|can you/gi, '')
      .trim();
    
    if (searchQuery.length > 2) {
      console.log('🔍 Searching for products:', searchQuery);
      searchedProducts = await searchProducts(searchQuery);
      if (searchedProducts.length > 0) {
        storeContext.searchResults = searchedProducts.map(p => ({
          name: p.name,
          price: p.isOnSale && p.salePrice ? p.salePrice : p.price,
          originalPrice: p.price,
          category: p.category,
          brand: p.brand,
          inStock: p.stock > 0,
          stock: p.stock,
          isOnSale: p.isOnSale
        }));
        console.log('📦 Found', searchedProducts.length, 'matching products');
      }
    }
  }
  
  // Build system prompt with real data
  const systemPrompt = buildSystemPrompt(storeContext, history);
  console.log('📋 System prompt length:', systemPrompt.length);
  
  // Try Gemini API first
  console.log('🤖 Calling Gemini API...');
  let response = await callGeminiAPI(message, systemPrompt, history.slice(-10));
  
  // Fallback if Gemini fails
  if (!response) {
    console.log('⚠️ Gemini failed, using fallback response');
    response = generateFallbackResponse(message, storeContext, lowerMessage);
  } else {
    console.log('✅ Got response from Gemini');
  }
  
  // Add messages to history AFTER getting response
  addToHistory(sessionId, 'user', message);
  addToHistory(sessionId, 'assistant', response);
  
  // Generate suggestions
  const suggestions = generateSuggestions(message, storeContext);
  
  // Generate actions
  const actions = [];
  if (lowerMessage.includes('order') || lowerMessage.includes('track')) {
    actions.push({ type: 'link', label: 'View My Orders', url: '/orders' });
  }
  if (lowerMessage.includes('product') || lowerMessage.includes('shop') || lowerMessage.includes('buy') || lowerMessage.includes('browse')) {
    actions.push({ type: 'link', label: 'Browse Products', url: '/products' });
  }
  if (sentiment.needsHuman) {
    actions.push({ type: 'link', label: 'Create Support Ticket', url: '/help?tab=tickets' });
  }
  
  return {
    response,
    suggestions,
    actions,
    relatedProducts: searchedProducts.slice(0, 5),
    relatedFaqs: [],
    sentiment,
    sessionId // Return session ID for context tracking
  };
};

// Fallback response generator (if Gemini API fails)
const generateFallbackResponse = (message, storeContext, lowerMessage) => {
  // Handle coupons
  if (lowerMessage.includes('coupon') || lowerMessage.includes('discount') || lowerMessage.includes('promo') || lowerMessage.includes('deal') || lowerMessage.includes('offer')) {
    if (storeContext.coupons && storeContext.coupons.length > 0) {
      let response = `🎉 **Active Coupons & Offers (${storeContext.coupons.length} available):**\n\n`;
      storeContext.coupons.forEach((c, i) => {
        response += `**${i + 1}. ${c.code}** - ${c.discount} OFF\n`;
        if (c.description) response += `   📝 ${c.description}\n`;
        if (c.minPurchase > 0) response += `   💰 Min. purchase: $${c.minPurchase}\n`;
        if (c.maxDiscount) response += `   🔝 Max discount: $${c.maxDiscount}\n`;
        response += `   ⏰ Valid until: ${new Date(c.expiresAt).toLocaleDateString()}\n\n`;
      });
      response += `💡 **How to use:** Enter the code at checkout in the 'Promo Code' field.`;
      return response;
    }
    return "Currently, there are no active coupons. Check back later or subscribe to our newsletter for exclusive deals!";
  }
  
  // Handle order queries
  if (lowerMessage.includes('order') || lowerMessage.includes('track')) {
    if (storeContext.userOrders && storeContext.userOrders.length > 0) {
      let response = `📦 **Your Recent Orders:**\n\n`;
      storeContext.userOrders.forEach((o, i) => {
        const statusEmoji = {
          'pending': '🆕',
          'processing': '⚙️',
          'shipped': '🚚',
          'delivered': '✅',
          'cancelled': '❌'
        }[o.status] || '📦';
        
        response += `${i + 1}. **Order #${o.orderNumber}** ${statusEmoji}\n`;
        response += `   Status: ${o.status} | Total: ₹${o.total.toFixed(2)}\n`;
        response += `   Date: ${new Date(o.date).toLocaleDateString()}\n\n`;
      });
      return response;
    }
    return "To track your order, go to 'My Orders' in your account. If you're not logged in, please log in first to see your orders.";
  }
  
  // Handle greetings
  if (/^(hi|hello|hey|good)/i.test(lowerMessage)) {
    let response = `👋 Hello${storeContext.userName ? ` ${storeContext.userName}` : ''}! Welcome to ShopHub Support!\n\n`;
    response += `I'm your AI assistant powered by Gemini, here to help you with:\n`;
    response += `• 📦 Orders & Shipping\n`;
    response += `• ↩️ Returns & Refunds\n`;
    response += `• 💳 Payment Questions\n`;
    response += `• 🛍️ Product Information\n`;
    response += `• 🎟️ Coupons & Deals\n\n`;
    
    if (storeContext.store) {
      response += `📊 **Store Highlights:**\n`;
      response += `• ${storeContext.store.totalProducts} products available\n`;
      response += `• ${storeContext.store.totalCategories} categories\n`;
      if (storeContext.coupons?.length > 0) {
        response += `• ${storeContext.coupons.length} active coupons!\n`;
      }
    }
    
    response += `\nHow can I assist you today?`;
    return response;
  }
  
  // Default response
  return "I'm here to help! You can ask me about:\n• Active coupons and discounts\n• Your orders and tracking\n• Products and categories\n• Shipping and returns\n• Payment options\n\nWhat would you like to know?";
};

// Quick reply templates
export const getQuickReplies = () => [
  { label: '📦 Track Order', message: 'I want to track my order' },
  { label: '↩️ Returns', message: 'How do I return an item?' },
  { label: '💳 Payment', message: 'What payment methods do you accept?' },
  { label: '🚚 Shipping', message: 'What are your shipping options?' },
  { label: '🎟️ Coupons', message: 'Show me all active coupons' },
  { label: '👤 Account', message: 'I need help with my account' }
];

export default {
  generateAIResponse,
  getQuickReplies,
  clearConversationHistory
};
