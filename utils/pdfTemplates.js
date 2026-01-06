export function reportTemplate(data) {
    const {
        reportNumber,
        title,
        type,
        grade,
        createdAt,
        content,
        summary,
        createdBy,
        classInfo,
        fontPath
    } = data;

    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<style>
@font-face {
    font-family: 'Amiri';
    src: url('${fontPath}') format('truetype');
}
body {
    font-family: 'Amiri', serif;
    direction: rtl;
    margin: 40px;
    color: #000;
}
h1 {
    text-align: center;
    margin-bottom: 30px;
}
.section {
    margin-bottom: 20px;
}
.label {
    font-weight: bold;
}
hr {
    margin: 20px 0;
}
table {
    width: 100%;
    border-collapse: collapse;
}
td, th {
    border: 1px solid #333;
    padding: 8px;
    text-align: right;
}
</style>
</head>

<body>

<h1>تقرير الأداء التعليمي</h1>

<div class="section">
    <div><span class="label">رقم التقرير:</span> ${reportNumber}</div>
    <div><span class="label">العنوان:</span> ${title}</div>
    <div><span class="label">النوع:</span> ${type}</div>
    <div><span class="label">بواسطة:</span> ${createdBy}</div>
    <div><span class="label">تاريخ الإنشاء:</span> ${createdAt}</div>
</div>

<hr />

<div class="section">
    <h3>البيانات الأكاديمية</h3>
    <div><span class="label">الصف:</span> ${grade}</div>
    <div><span class="label">الفصل:</span> ${classInfo}</div>
</div>

<hr />

<div class="section">
    <h3>الموجز الإحصائي</h3>
    <table>
        <tr>
            <th>المؤشر</th>
            <th>القيمة</th>
        </tr>
        <tr>
            <td>نسبة الحضور</td>
            <td>${summary.attendanceRate}%</td>
        </tr>
        <tr>
            <td>عدد المخالفات السلوكية</td>
            <td>${summary.behaviorIncidents}</td>
        </tr>
    </table>
</div>

${content ? `
<hr />
<div class="section">
    <h3>محتوى التقرير</h3>
    <p>${content}</p>
</div>` : ''}

</body>
</html>
`;
}
