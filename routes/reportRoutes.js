import express from 'express';
import { 
    createReport, 
    getReports, 
    approveReport, 
    exportReport 
} from '../controllers/report.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();


router.use(verifyToken);

router.post('/report-create',createReport);

router.patch('/approve/:id', approveReport); 
router.get('/retrive',getReports)
router.get('/export/:id', exportReport);    

export default router;