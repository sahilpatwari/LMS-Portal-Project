import express from 'express';
import { forgotPassword, resetPassword } from '../controllers/passwordResetController.js';

const router = express.Router();

// @route   POST /api/password/forgot
router.post('/forgot', forgotPassword);

// @route   POST /api/password/reset
router.post('/reset', resetPassword);

export default router;