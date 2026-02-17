import { Test, TestingModule } from '@nestjs/testing';
import { TenantDatabaseService } from "./tenant-database.service";
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('TenantDatabaseService', () => {
  let service: TenantDatabaseService;
  let mockDefaultDataSource: { // Using a more direct mock object structure
    query: jest.Mock;
    isInitialized: boolean;
    initialize: jest.Mock;
    destroy: jest.Mock;
    getRepository: jest.Mock;
    // Add other necessary properties with dummy values or mocks if TypeORM complains about their absence
    // For example, properties accessed directly by the service that are not functions
  };
  let mockConfigService: { // Using a more direct mock object structure
    get: jest.Mock;
  };

  beforeEach(async () => {
    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    mockDefaultDataSource = {
      query: jest.fn(),
      isInitialized: true,
      initialize: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
      getRepository: jest.fn(() => ({} as Repository<any>)),
      // Minimal properties to satisfy usage in TenantDatabaseService methods
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'database') {
          return {
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            username: 'hub_user',
            password: 'hub_password',
            database: 'hub_db',
            synchronize: false,
            logging: false,
          };
        }
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantDatabaseService,
        {
          provide: getDataSourceToken(), // This token is for the @InjectDataSource()
          useValue: mockDefaultDataSource as any, // Cast to any here to bypass strict TypeORM DataSource type
        },
        {
          provide: ConfigService,
          useValue: mockConfigService as any, // Cast to any here to bypass strict ConfigService type
        },
      ],
    }).compile();

    service = module.get<TenantDatabaseService>(TenantDatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ensure a tenant database exists', async () => {
    const dbName = 'test_tenant_db';
    await service.ensureTenantDatabase(dbName);
    expect(mockDefaultDataSource.query).toHaveBeenCalledWith(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  });

  it('should return a cached data source if initialized', async () => {
    const dbName = 'cached_db';
    const mockTenantDataSource = {
      isInitialized: true,
      query: jest.fn(),
      initialize: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
      getRepository: jest.fn(() => ({} as Repository<any>)),
    } as any; // Cast to any to bypass strict TypeORM DataSource type

    // Directly manipulate the private `dataSources` map
    (service as any).dataSources.set(dbName, mockTenantDataSource);

    const result = await service.getTenantDataSource(dbName);
    expect(result).toBe(mockTenantDataSource);
    expect(mockTenantDataSource.initialize).not.toHaveBeenCalled();
  });

  // This test requires mocking the `DataSource` constructor globally or finding a way to inject it
  // For now, it's complex due to `new DataSource(options)` call inside the service.
  // Will skip or reconsider this test for a simpler approach if it becomes a blocker.
  // it.skip('should initialize and return a new data source if not cached', async () => {
  //   const dbName = 'new_db';
  //   const newMockDataSource = {
  //     isInitialized: false,
  //     initialize: jest.fn().mockResolvedValue(undefined),
  //     destroy: jest.fn().mockResolvedValue(undefined),
  //     getRepository: jest.fn(() => ({} as Repository<any>)),
  //     options: {} as any, // Minimal options
  //     driver: {} as any, // Minimal driver
  //     manager: {} as any, // Minimal manager
  //     name: `tenant_${dbName}`,
  //   } as any; // Cast to any to bypass strict TypeORM DataSource type

  //   // Mock the DataSource constructor if it's called inside the service
  //   const originalDataSource = require('typeorm').DataSource;
  //   const mockDataSourceConstructor = jest.spyOn(require('typeorm'), 'DataSource').mockImplementation(() => newMockDataSource);

  //   const result = await service.getTenantDataSource(dbName);
  //   expect(result).toBe(newMockDataSource);
  //   expect(newMockDataSource.initialize).toHaveBeenCalled();
  //   expect((service as any).dataSources.has(dbName)).toBe(true);

  //   mockDataSourceConstructor.mockRestore(); // Restore original implementation
  // });

  // TODO: Add more tests for other methods like getTenantRepository, disposeTenantDataSource, onModuleDestroy
});