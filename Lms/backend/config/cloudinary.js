
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const storage = multer.memoryStorage();
export const upload = multer({ storage });


export const uploadVideoToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_chunked_stream(
      { resource_type: 'video', folder: 'courses' },
      (error, result) => {
        if (error) return reject(error);
     
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

   
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};


export { cloudinary };