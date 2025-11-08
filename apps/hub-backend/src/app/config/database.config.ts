import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserOrganization } from '../entities/user-organization.entity';
import { Organization } from '../entities/organization.entity';
import { Application } from '../entities/application.entity';
import { Subscription } from '../entities/subscription.entity';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'hub_user',
    password: process.env.DB_PASSWORD || 'hub_password',
    database: process.env.DB_DATABASE || 'hub_db',
    entities: [User, UserOrganization, Organization, Application, Subscription],
    synchronize: process.env.NODE_ENV !== 'production', // true en dev, false en prod
    logging: process.env.NODE_ENV === 'development',
    autoLoadEntities: false, // Explicitly using entities array
    migrations: [__dirname + '/../../migrations/**/*{.ts,.js}'],
    migrationsRun: false,
  }),
);

