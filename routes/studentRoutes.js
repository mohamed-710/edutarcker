import express from 'express';
import { 
    getAllStudents, 
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
} from '../controllers/student.js';

const router = express.Router();

router.get('/',getAllStudents);

router.post('/create-student', createStudent);

router.route('/:id')
.get(getStudentById)
.put(updateStudent)
.delete(deleteStudent);

export default router;