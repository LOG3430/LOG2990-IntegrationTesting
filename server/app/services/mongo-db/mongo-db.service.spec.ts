import { Test, TestingModule } from '@nestjs/testing';
import { MongoDbService } from './mongo-db.service';

import { MongoMemoryServer } from 'mongodb-memory-server';

describe('MongoDbService', () => {
    let service: MongoDbService;
    let mongoServer: MongoMemoryServer;
    const databaseName = 'theDatabaseName';

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
    });

    afterAll(async () => {
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: MongoDbService,
                    useFactory: async () => {
                        return MongoDbService.mongoDbFactory(mongoServer.getUri(), databaseName);
                    },
                },
            ],
        }).compile();

        service = module.get<MongoDbService>(MongoDbService);
    });

    afterEach(async () => {
        if (service) {
            await service.disconnect();
        }
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should be able to provide a collection', () => {
        expect(service.collection('theCollectionName')).toBeTruthy();
    });

    it('connect should do nothing if already connected', () => {
        expect(service.isConnected()).toBeTruthy();
        const clientSpy = jest.spyOn(service['client'], 'connect');
        service.connect('db');
        expect(clientSpy).not.toBeCalled();
    });

    it('should provide a simple provider', () => {
        jest.spyOn(MongoDbService, 'mongoDbFactory').mockImplementation(async (dbUrl: string, dbName: string) => {
            expect(dbUrl).toBe(process.env.DATABASE_CONNECTION_STRING);
            expect(dbName).toBe(process.env.DATABASE_DB_NAME);
            return new Promise(() => service);
        });

        expect(MongoDbService.mongoDbProvider.useFactory()).toBeDefined();
    });
});
