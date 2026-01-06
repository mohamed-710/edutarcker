import { Op, fn, col, Sequelize } from 'sequelize';
import sequelize from '../config/db_config.js';
import { asyncWrapper } from '../middlewares/asyncWrapper.js';
import { models } from '../utils/db_instance.js';
import appError from '../utils/app_error.js';
import httpStatusText from '../utils/httpStatusText.js';
const { Report, Attendance, BehaviorRecord, Student, Teacher, User,Class } = models;
import puppeteer from 'puppeteer';
import path from 'path';
import { reportTemplate } from '../utils/pdfTemplates.js';

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
    const report = await Report.findByPk(req.params.id, {
        include: [
            { model: User, as: 'createdBy', attributes: ['name'] },
            { model: Class, as: 'class', attributes: ['name', 'section'] }
        ]
    });

    if (!report)
        return next(appError.create('Report not found', 404, httpStatusText.FAIL));

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    const fontPath = `file://${path.resolve('fonts/Amiri-Regular.ttf')}`;

    const html = reportTemplate({
        reportNumber: report.reportNumber,
        title: report.title,
        type: report.type,
        grade: report.grade ?? '-',
        createdAt: report.createdAt.toISOString().split('T')[0],
        content: report.content,
        summary: {
            attendanceRate: report.summary?.attendanceRate ?? 0,
            behaviorIncidents: report.summary?.behaviorIncidents ?? 0
        },
        createdBy: report.createdBy?.name ?? '-',
        classInfo: report.class
            ? `${report.class.name} (${report.class.section})`
            : '-',
        fontPath
    });

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();

    res
        .setHeader('Content-Type', 'application/pdf')
        .setHeader(
            'Content-Disposition',
            `attachment; filename=report-${report.reportNumber}.pdf`
        )
        .send(pdf);

    await report.increment('downloadCount');
});
export {
    createReport,
    getReports,
    approveReport,
    exportReport
};