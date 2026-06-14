// backend/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// 1. Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Multer to hold files temporarily in RAM buffer chunks
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// 3. Fixed streaming wrapper using 'upload_chunked_stream'
export const uploadVideoToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_chunked_stream(
      { resource_type: 'video', folder: 'courses' },
      (error, result) => {
        if (error) return reject(error);
        // Returns the safe secure link and the reference public token ID
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    // Turn the memory buffer into a readable stream and pipe it to Cloudinary
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

// 🌟 THE FIX: Explicitly export the raw 'cloudinary' object 
// so your CourseRoutes.js can import it for video deletions!
export { cloudinary };