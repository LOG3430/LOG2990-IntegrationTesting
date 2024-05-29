import { MongoDbService } from '@app/services/mongo-db/mongo-db.service';
import { History } from '@common/history';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { HistoryService } from './history.service';

const history: History[] = [{} as unknown as History, {} as unknown as History];

describe('HistoryService', () => {
    let service: HistoryService;
    let mongoServer: MongoMemoryServer;
    let mongoService: MongoDbService;

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HistoryService,
                {
                    provide: MongoDbService,
                    useFactory: async () => {
                        return MongoDbService.mongoDbFactory(mongoServer.getUri(), 'history');
                    },
                },
            ],
        }).compile();
        mongoService = module.get<MongoDbService>(MongoDbService);
        service = module.get<HistoryService>(HistoryService);
    });

    afterEach(async () => {
        await mongoService.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    describe('init', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should be empty on initialisation', async () => {
            expect(await service.findAll()).toEqual([]);
        });
    });

    describe('find', () => {
        it('should be able to find a quiz that exists', async () => {
            await service.add(history[0]);
            expect((await service.findAll()).length).toEqual(1);
        });
    });

    describe('add', () => {
        it('should be able to add a necessary quiz info', async () => {
            await service.add(history[0]);
            expect((await service.findAll()).length).toEqual(1);
        });

        it('should have 2 played games in history', async () => {
            await service.add(history[0]);
            await service.add(history[1]);
            expect((await service.findAll()).length).toEqual(2);
        });
    });

    describe('remove', () => {
        it('should be able to remove whole history', async () => {
            await service.add(history[0]);
            await service.remove();
            expect(await service.findAll()).toEqual([]);
        });
    });
});
