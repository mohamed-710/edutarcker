import express from 'express';
import { getDashboardStats,getAttendanceChart,getPerformanceChart } from '../controllers/dashboard.js';
import { verifyToken } from '../middlewares/verifyToken.js'; 
import authorizeAdmin from '../middlewares/allowedTo.js'; 

const router = express.Router();
router.use(verifyToken);
router.use(authorizeAdmin);
router.get('/stats',  getDashboardStats);
router.get('/attendance-chart', getAttendanceChart);
router.get('/performance-chart', getPerformanceChart);
export default router;