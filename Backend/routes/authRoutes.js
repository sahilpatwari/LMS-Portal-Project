import express from 'express';
import { login, logout, refresh } from '../controllers/authController.js';

const router = express.Router();

// @route   POST /auth/login
// @desc    Login user (Admin, Student, or Teacher)
// @access  Public
router.post('/login', login);

// @route   POST /auth/logout
// @desc    Logout user and revoke refresh token
// @access  Public (uses cookie)
router.post('/logout', logout);

// @route   POST /auth/refresh
// @desc    Get a new access token using a refresh token
// @access  Public (uses cookie)
router.post('/refresh', refresh);

export default router;