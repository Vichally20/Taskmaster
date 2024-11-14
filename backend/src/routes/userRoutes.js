import express from 'express';
import { deleteUser, getAllUsers } from '../controllers/auth/adminController.js';
import {
    getUser,
    loginUser,
    logoutUser,
    registerUser,
    updateUser,
    userLoginStatus,
} from "../controllers/auth/userController.js";
import {
    adminMiddleware,
    creatorMiddleware,
    protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.get('/user', protect, getUser);
router.patch('/user', protect, updateUser);

// Admin routes
router.delete('/admin/users/:id', protect, adminMiddleware, deleteUser, getAllUsers);

//get all users
router.get('/admin/users', protect, creatorMiddleware, getAllUsers);

// login status
router.get('/login-status',userLoginStatus);

export default router;