import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  Application,
  Organization,
  OrganizationRole,
  OrganizationRolePermission,
  Permission,
  Subscription,
  User,
  UserOrganization,
} from '../entities';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'hub_user',
    password: process.env.DB_PASSWORD || 'hub_password',
    database: process.env.DB_DATABASE || 'hub_db',
    entities: [
      User,
      UserOrganization,
      Organization,
      Application,
      Subscription,
      OrganizationRole,
      OrganizationRolePermission,
      Permission,
    ],
    synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
    logging: process.env.NODE_ENV === 'development',
    autoLoadEntities: false,
  }),
);

