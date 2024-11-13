import express from 'express';
import {
     getUser,
     loginUser,
     logoutUser,
     registerUser,
     } from "../controllers/auth/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { updateUser } from '../controllers/auth/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.get('/user', protect, getUser);
router.patch('/user', protect, updateUser);

export default router;