import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  EntityTarget,
  Repository,
} from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

type TenantDataSource = DataSource;

@Injectable()
export class TenantDatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantDatabaseService.name);
  private readonly dataSources = new Map<string, TenantDataSource>();

  constructor(
    @InjectDataSource()
    private readonly defaultDataSource: DataSource,
    private readonly configService: ConfigService
  ) {}

  async ensureTenantDatabase(databaseName: string): Promise<void> {
    this.logger.debug(`Ensuring database "${databaseName}" exists`);
    await this.defaultDataSource.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  }

  async getTenantDataSource(databaseName: string): Promise<TenantDataSource> {
    const cached = this.dataSources.get(databaseName);
    if (cached?.isInitialized) {
      return cached;
    }

    if (cached && !cached.isInitialized) {
      await cached.initialize();
      return cached;
    }

    const options = this.createTenantOptions(databaseName);
    const dataSource = new DataSource(options);
    await dataSource.initialize();
    this.logger.debug(`Initialized connection for tenant "${databaseName}"`);
    this.dataSources.set(databaseName, dataSource);
    return dataSource;
  }

  async getTenantRepository<Entity>(
    databaseName: string,
    entity: EntityTarget<Entity>
  ): Promise<Repository<Entity>> {
    const dataSource = await this.getTenantDataSource(databaseName);
    return dataSource.getRepository(entity);
  }

  async disposeTenantDataSource(databaseName: string): Promise<void> {
    const dataSource = this.dataSources.get(databaseName);
    if (!dataSource) {
      return;
    }

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }

    this.dataSources.delete(databaseName);
    this.logger.debug(`Closed connection for tenant "${databaseName}"`);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(
      Array.from(this.dataSources.keys()).map((databaseName) =>
        this.disposeTenantDataSource(databaseName)
      )
    );
  }

  private createTenantOptions(database: string): MysqlConnectionOptions {
    const baseOptions =
      this.configService.get<MysqlConnectionOptions>('database');
    if (!baseOptions) {
      throw new Error('Database configuration is missing');
    }

    const {
      database: _ignoredDatabase,
      name: _ignoredName,
      ...connectionOptions
    } = baseOptions;

    return {
      ...connectionOptions,
      type: 'mysql',
      name: `tenant_${database}`,
      database,
      synchronize: connectionOptions.synchronize ?? false,
    } as MysqlConnectionOptions;
  }
}

