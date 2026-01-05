import { Op, fn, col, Sequelize } from 'sequelize';
import PDFDocument from 'pdfkit';
import sequelize from '../config/db_config.js';
import { asyncWrapper } from '../middlewares/asyncWrapper.js';
import { models } from '../utils/db_instance.js';
import appError from '../utils/app_error.js';
import httpStatusText from '../utils/httpStatusText.js';
import { formatArabic } from '../utils/pdf_helper.js';
import path from 'path';
const { Report, Attendance, BehaviorRecord, Student, Teacher, User } = models;

/**
 * @desc    Create a new report with automated statistics aggregation within a transaction
 * @route   POST /api/reports
 * @method  POST
 * @access  Admin/Teacher
 */
const createReport = asyncWrapper(async (req, res, next) => {

    const { title, type, grade, classId, periodStart, periodEnd } = req.body;
    console.log(req.user);
    if (!classId || !periodStart || !periodEnd) {
        return next(appError.create('الرجاء إرسال معرف الفصل (classId) والفترة الزمنية', 400, httpStatusText.FAIL));
    }

    if (new Date(periodStart) > new Date(periodEnd)) {
        return next(appError.create('تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية', 400, httpStatusText.FAIL));
    }

    const result = await sequelize.transaction(async (t) => {
        const stats = await Attendance.findOne({
            attributes: [
                [fn('COUNT', col('Attendance.id')), 'total'],
                [fn('SUM', Sequelize.literal('CASE WHEN "Attendance"."status" = \'present\' THEN 1 ELSE 0 END')), 'presentCount']],
            include: [{
                model: Student,
                as: 'student',
                attributes: [],
                where: { classId: classId }
            }],
            where: {
                date: { [Op.between]: [periodStart, periodEnd] }
            },
            subQuery: false,
            raw: true,
            transaction: t
        });

        const behaviorCount = await BehaviorRecord.count({
            include: [{
                model: Student,
                as: 'student',
                where: { classId: classId }
            }],
            where: {
                category: 'violation',
                date: { [Op.between]: [periodStart, periodEnd] }
            },
            transaction: t
        });

        const total = parseInt(stats?.total) || 0;
        const present = parseInt(stats?.presentCount) || 0;
        const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

        return await Report.create({
            title,
            type,
            grade,
            classId,
            periodStart,
            periodEnd,
            createdById: req.user.id,
            status: req.user.role === 'admin' ? 'approved' : 'pending',
            approvedById: req.user.role === 'admin' ? req.user.id : null,
            approvedAt: req.user.role === 'admin' ? new Date() : null,
            summary: {
                attendanceRate,
                behaviorIncidents: behaviorCount,
                totalRecords: total
            }
        }, { transaction: t });
    });

    res.status(201).json({
        success: true,
        message: 'تم إنشاء التقرير وتجميع البيانات بنجاح',
        data: result
    });
});

/**
 * @desc    Get all reports with optional filtering and formatted response
 * @route   GET /api/reports
 * @method  GET
 * @access  Admin/Teacher/Counselor
 */
const getReports = asyncWrapper(async (req, res) => {
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const reports = await Report.findAll({
        where,
        include: [
            {
                model: User,
                as: 'createdBy',
                attributes: ['id', 'name']
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    const formattedReports = reports.map(r => ({
        id: r.id,
        reportNumber: r.reportNumber,
        title: r.title,
        type: r.type,
        grade: r.grade,
        createdBy: r.createdBy?.name || 'Unknown',
        createdAt: r.createdAt,
        status: r.status,
        summary: r.summary
    }));


    res.status(200).json(
        {
            success: true,
            data: formattedReports
        });
});

/**
 * @desc    Approve a report and update status with state guard validation
 * @route   PUT /api/reports/:id/approve
 * @method  PUT
 * @access  Admin
 */
const approveReport = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const report = await Report.findByPk(id);
    if (!report) return next(appError.create('Report not found', 404, httpStatusText.FAIL));

    const allowedToApprove = ['pending', 'draft'];
    if (!allowedToApprove.includes(report.status)) {
        return next(appError.create(`Cannot approve a report with current status: ${report.status}`, 400, httpStatusText.FAIL));
    }

    await report.update({
        status: 'approved',
        approvedById: req.user.id,
        approvedAt: new Date()
    });

    res.status(200).json({ success: true, message: 'Report approved successfully' });
});

/**
 * @desc    Export report as PDF with RTL (Arabic) support and shaping
 * @route   GET /api/reports/:id/export
 * @method  GET
 * @access  Admin/Teacher/Parent
 */


const exportReport = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const report = await Report.findByPk(id, {
        include: [{ model: User, as: 'createdBy', attributes: ['name'] }]
    });

    if (!report) return next(appError.create('Report not found', 404, httpStatusText.FAIL));

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${report.reportNumber}.pdf`);

    doc.pipe(res);

    const fontPath = 'fonts/Amiri-Regular.ttf';
    doc.font(fontPath);
    // ------------------------

    doc.fontSize(22).text(formatArabic("تقرير الأداء التعليمي"), { align: 'center' });
    doc.moveDown();

    doc.fontSize(14);
    doc.text(`${formatArabic("رقم التقرير")}: ${report.reportNumber}`, { align: 'right' });
    doc.text(`${formatArabic("العنوان")}: ${formatArabic(report.title)}`, { align: 'right' });
    doc.text(`${formatArabic("بواسطة")}: ${formatArabic(report.createdBy?.name)}`, { align: 'right' });

    doc.moveDown();
    doc.text("--------------------------------------------------", { align: 'center' });
    doc.moveDown();

    doc.fontSize(16).text(formatArabic("الموجز الإحصائي"), { align: 'right', underline: true });
    doc.moveDown(0.5);
    doc.fontSize(14);
    doc.text(`${formatArabic("نسبة الحضور المدرسية")}: ${report.summary.attendanceRate}%`, { align: 'right' });
    doc.text(`${formatArabic("إجمالي عدد المخالفات السلوكية")}: ${report.summary.behaviorIncidents}`, { align: 'right' });

    doc.end();
    await report.increment('downloadCount');
});
export {
    createReport,
    getReports,
    approveReport,
    exportReport
};