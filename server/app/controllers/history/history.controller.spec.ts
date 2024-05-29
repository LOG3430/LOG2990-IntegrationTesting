import { HistoryService } from '@app/services/history/history.service';
import { History } from '@common/history';
import { Test, TestingModule } from '@nestjs/testing';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { HistoryController } from './history.controller';

const history: History[] = [{} as unknown as History, {} as unknown as History];
const newPlayedGame: History = {} as unknown as History;

describe('HistoryController', () => {
    let controller: HistoryController;
    let service: SinonStubbedInstance<HistoryService>;

    beforeEach(async () => {
        service = createStubInstance(HistoryService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HistoryController],
            providers: [{ provide: HistoryService, useValue: service }],
        }).compile();

        controller = module.get<HistoryController>(HistoryController);
        controller.remove();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('GET', () => {
        it('findAll() should return all history', async () => {
            service.findAll.resolves(history);
            expect(await controller.findAll()).toEqual(history);
            expect(service.findAll.calledOnce).toBeTruthy();
        });
    });

    describe('POST', () => {
        it('add() should successfully add played game to history', async () => {
            await controller.add(newPlayedGame);
            expect(service.add.calledOnceWith(newPlayedGame)).toBeTruthy();
        });
    });

    describe('DELETE', () => {
        it('remove() should call remove method from service', async () => {
            await controller.remove();
            expect(service.remove.called).toBeTruthy();
        });
    });
});
