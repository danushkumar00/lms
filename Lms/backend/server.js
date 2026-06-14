// server.js
import 'dotenv/config';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/AuthRoutes.js';
import courseRoutes from './routes/CourseRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({origin: ['https://lms-orpin-psi.vercel.app','https://lms-orpin-psi.vercel.app/'],
  credentials: true})); 
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Base Route for testing
app.get('/', (req, res) => {
  res.send('API is running successfully...');
});

// Error handling middleware for fallback
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
app.use('/api/courses', courseRoutes);