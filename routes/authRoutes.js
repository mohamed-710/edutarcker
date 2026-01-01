import express from 'express';
import {
  registerAdmin,
  loginUser,
  logout
} from '../controllers/auth.js';
import {verifyToken} from '../middlewares/verifyToken.js'

const router = express.Router();

router.post('/register-admin', registerAdmin); // TEMPORARY
router.post('/login', loginUser);
router.post('/logout',verifyToken,logout);

export default router;
