// routes/authRoutes.js
import express from 'express';
import { loginUser,registerUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);
// You would also add your router.post('/signup', registerUser) here

export default router;