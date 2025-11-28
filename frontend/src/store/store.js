import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';
import userReducer from './slices/userSlice';
import wishlistReducer from './slices/wishlistSlice';
import addressReducer from './slices/addressSlice';
import couponReducer from './slices/couponSlice';
import recentlyViewedReducer from './slices/recentlyViewedSlice';
import compareReducer from './slices/compareSlice';
import questionReducer from './slices/questionSlice';
import stockAlertReducer from './slices/stockAlertSlice';
import supportReducer from './slices/supportSlice';
import paymentReducer from './slices/paymentSlice';
import loyaltyReducer from './slices/loyaltySlice';
import referralReducer from './slices/referralSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productReducer,
    orders: orderReducer,
    users: userReducer,
    wishlist: wishlistReducer,
    address: addressReducer,
    coupon: couponReducer,
    recentlyViewed: recentlyViewedReducer,
    compare: compareReducer,
    questions: questionReducer,
    stockAlert: stockAlertReducer,
    support: supportReducer,
    payment: paymentReducer,
    loyalty: loyaltyReducer,
    referral: referralReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
