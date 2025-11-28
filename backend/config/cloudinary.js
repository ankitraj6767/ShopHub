import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import config from './config.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

// Use memory storage - we'll upload to Cloudinary manually
const memoryStorage = multer.memoryStorage();

// For local storage fallback (development without Cloudinary)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `product-${uniqueSuffix}-${file.originalname}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Use Cloudinary if configured, otherwise use local storage
const useCloudinary = config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret;

export const upload = multer({
  storage: useCloudinary ? memoryStorage : localStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Upload buffer to Cloudinary
export const uploadToCloudinary = async (file, folder = 'shophub/products') => {
  try {
    // If file is a buffer (from memory storage), convert to base64
    if (file.buffer) {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(base64, {
        folder,
        resource_type: 'auto',
        transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }],
      });
      return {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }
    
    // If file is a path or URL
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
    });
    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

export default cloudinary;
