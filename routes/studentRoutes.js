import express from 'express';
import { 
    getAllStudents, 
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
} from '../controllers/student.js';
import { verifyToken } from '../middlewares/verifyToken.js'; 
import authorizeAdmin from '../middlewares/allowedTo.js'; 
const router = express.Router();
router.use(verifyToken);
router.use(authorizeAdmin);
router.get('/all-student',getAllStudents);

router.post('/create-student', createStudent);

router.route('/spacific-student/:id')
.get(getStudentById)
.put(updateStudent)
.delete(deleteStudent);

export default router;