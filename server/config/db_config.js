import { Sequelize } from 'sequelize';
import dotenv from 'dotenv'
import User from '../models/user.js'
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import Parent from '../models/parent.js';
import Class from '../models/class.js';
import Subject from '../models/subject.js';
import Attendance from '../models/attendance.js';
import Grade from '../models/grade.js';
import BehaviorRecord from '../models/behaviorRecord.js';
import GuidanceCase from '../models/guidanceCase.js';
import Communication from '../models/communication.js';
import Notification from '../models/notification.js';
import Circular from '../models/circular.js';
import Report from '../models/report.js';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
 dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: console.log
  }
);

const models = {
  User,
  Student,
  Teacher,
  Parent,
  Class,
  Subject,
  Attendance,
  Grade,
  BehaviorRecord,
  GuidanceCase,
  Communication,
  Notification,
  Circular,
  Report
}

Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models)
  }
})

export const syncTables = async () => {
  await sequelize.sync({alter: true})
}

export default sequelize;

export {models};