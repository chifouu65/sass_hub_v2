import { DataSource, DataSourceOptions } from 'typeorm';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', override: true });
loadEnv({ path: '.env', override: false });

const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'hub_user',
  password: process.env.DB_PASSWORD || 'hub_password',
  database: process.env.DB_DATABASE || 'hub_db',
  entities: ['apps/hub-backend/src/app/entities/**/*{.ts,.js}'],
  migrations: ['apps/hub-backend/src/app/migrations/**/*{.ts,.js}'],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);

