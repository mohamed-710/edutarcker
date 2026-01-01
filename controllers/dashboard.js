import { asyncWrapper } from '../middlewares/asyncWrapper.js';
import { models, sequelize } from '../utils/db_instance.js';
import httpStatusText from '../utils/httpStatusText.js';
import { Op } from 'sequelize';
const {
    Student,
    Teacher,
    Report,
    Circular,
    BehaviorRecord,
    Attendance,
    Class,
    Grade,
    Subject
} = models;
/**
 * @desc    Get dashboard statistics
 * @method  GET
 * @route   GET /api/dashboard/stats
 * @access  Private (Admin)
 */

const getDashboardStats = asyncWrapper(async (req, res, next) => {
    const [
        totalStudents,
        totalTeachers,
        pendingReports,
        behaviorCases,
        activeCirculars,
        totalAttendance,
        presentAttendance
    ] = await Promise.all([
        Student.count({ where: { status: 'active' } }),
        Teacher.count({ where: { status: 'active' } }),
        Report.count({ where: { status: 'pending' } }),
        BehaviorRecord.count({ where: { status: 'pending' } }),
        Circular.count({ where: { status: 'active' } }),
        Attendance.count(),
        Attendance.count({ where: { status: 'present' } })]);

    const attendanceRate = totalAttendance > 0
        ? parseFloat(((presentAttendance / totalAttendance) * 100).toFixed(1))
        : 0;
    res.status(200).json({
        success: true,
        data: {
            totalStudents,
            totalTeachers,
            attendanceRate,
            pendingReports,
            behaviorCases,
            activeCirculars
        }
    });
});


/**
 * @desc    Get attendance data by grade for charts
 * @method  GET
 * @route   GET /api/dashboard/attendance-chart
 * @access  private (Admin Only)
 */
const getAttendanceChart = asyncWrapper(async (req, res, next) => {
    const { period = 'week' } = req.query;

    const now = new Date();
    const startDate = period === 'month'
        ? new Date(now.setMonth(now.getMonth() - 1))
        : period === 'semester'
            ? new Date(now.setMonth(now.getMonth() - 4))
            : new Date(now.setDate(now.getDate() - 7));

    const stats = await Attendance.findAll({
        where: {
            date: { [Op.gte]: startDate }
        },
        include: [{
            model: Student,
            as: 'student',
            attributes: [],
            include: [{
                model: Class,
                as: 'class',
                attributes: []
            }]
        }],
        attributes: [
            [sequelize.col('student.class.grade'), 'grade'],
            [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'total'],
            [sequelize.fn('SUM', sequelize.literal("CASE WHEN \"Attendance\".\"status\" = 'present' THEN 1 ELSE 0 END")), 'presentCount'],
            [sequelize.fn('SUM', sequelize.literal("CASE WHEN \"Attendance\".\"status\" = 'absent' THEN 1 ELSE 0 END")), 'absentCount']
        ],
        group: [sequelize.col('student.class.grade')],
        raw: true
    });

    const data = stats.map(stat => {
        const total = parseInt(stat.total) || 0;
        const present = parseInt(stat.presentCount) || 0;
        const absent = parseInt(stat.absentCount) || 0;

        const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
        const absenceRate = total > 0 ? Math.round((absent / total) * 100) : 0;

        return {
            grade: stat.grade || 'غير محدد',
            attendance: attendanceRate,
            absence: absenceRate
        };
    });


    res.status(200).json({
        success: true,
        status: httpStatusText.SUCCESS,
        data: data
    });
});
/**
 * @desc    Get performance data by subject
 * @method  GET
 * @route   GET /api/dashboard/performance-chart
 * @access  private (Admin Only)
 */
const getPerformanceChart = asyncWrapper(async (req, res, next) => {
    const { period = 'week' } = req.query;

    const now = new Date();
    const startDate = period === 'month'
        ? new Date(now.setMonth(now.getMonth() - 1))
        : period === 'semester'
        ? new Date(now.setMonth(now.getMonth() - 4))
        : new Date(now.setDate(now.getDate() - 7));

    const stats = await Grade.findAll({
        where: {
            createdAt: { [Op.gte]: startDate }
        },
        include: [{
            model: Subject,
            as: 'subject', 
            attributes: [] 
        }],
        attributes: [
            [sequelize.col('subject.name'), 'subjectName'],
            [sequelize.col('subject.passingGrade'), 'passMark'],
            [sequelize.fn('AVG', sequelize.col('total')), 'averageTotal'],
            [sequelize.fn('COUNT', sequelize.col('Grade.id')), 'studentCount'],
            [sequelize.fn('SUM', sequelize.literal('CASE WHEN "total" >= "subject"."passingGrade" THEN 1 ELSE 0 END')), 'passedCount']
        ],
        group: [sequelize.col('subject.name'), sequelize.col('subject.passingGrade')],
        raw: true
    });

    const data = stats.map(stat => {
        const avg = parseFloat(stat.averageTotal) || 0;
        const total = parseInt(stat.studentCount) || 0;
        const passed = parseInt(stat.passedCount) || 0;

        return {
            subject: stat.subjectName || 'مادة غير معرفة',
            average: Math.round(avg),
            passing: total > 0 ? Math.round((passed / total) * 100) : 0
        };
    });

    res.status(200).json({
        success: true,
        data: data
    });
});

export { getDashboardStats, getAttendanceChart,getPerformanceChart };


