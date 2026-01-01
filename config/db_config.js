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



export const syncTables = async () => {
  await sequelize.sync({alter:false})
}

export default sequelize;

