<<<<<<< HEAD:server/utils/db_instance.js
=======
<<<<<<<< HEAD:server/config/db_config.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv'

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging:false,
 dialectOptions: {
      ssl: {
        require: false,
        rejectUnauthorized: false
      }
    },
  }
);
========
>>>>>>> 2025928705990603cfd95443839e2e8415a9fa8c:utils/db_instance.js
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
import sequelize from '../config/db_config.js';

<<<<<<< HEAD:server/utils/db_instance.js

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

=======
>>>>>>>> 2025928705990603cfd95443839e2e8415a9fa8c:utils/db_instance.js


<<<<<<<< HEAD:server/config/db_config.js

export const syncTables = async () => {
  await sequelize.sync({alter:false})
}

export default sequelize;

========
>>>>>>> 2025928705990603cfd95443839e2e8415a9fa8c:utils/db_instance.js
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models)
  }
});

export { models ,sequelize };
<<<<<<< HEAD:server/utils/db_instance.js
=======
>>>>>>>> 2025928705990603cfd95443839e2e8415a9fa8c:utils/db_instance.js
>>>>>>> 2025928705990603cfd95443839e2e8415a9fa8c:utils/db_instance.js
