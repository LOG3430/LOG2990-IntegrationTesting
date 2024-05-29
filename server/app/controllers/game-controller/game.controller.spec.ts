import { GameService } from '@app/services/game/game.service';
import { expectHttpResponse } from '@app/utils/expect-http-response';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { GameController } from './game.controller';

const roomId = 'abc';

describe('GameController', () => {
    let controller: GameController;
    let service: SinonStubbedInstance<GameService>;

    beforeEach(async () => {
        service = createStubInstance(GameService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GameController],
            providers: [
                {
                    provide: GameService,
                    useValue: service,
                },
            ],
        }).compile();

        controller = module.get<GameController>(GameController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return OK if the room exists', async () => {
        service.roomExists.returns(true);
        const res = expectHttpResponse(HttpStatus.OK);
        await controller.checkRoomExists(roomId, res);
        expect(service.roomExists.calledOnceWith(roomId));
    });

    it('should return NOT FOUND if the rooms does not exists', async () => {
        service.roomExists.returns(false);
        const res = expectHttpResponse(HttpStatus.NOT_FOUND);
        await controller.checkRoomExists(roomId, res);
        expect(service.roomExists.calledOnceWith(roomId));
    });
});
