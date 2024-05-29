import { GameService } from '@app/services/game/game.service';
import { socketMock } from '@app/utils/socket-mock';
import { CreateRequest, JoinResponse, PlayerInfos } from '@common/events';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Server, Socket } from 'socket.io';
import { GameGateway } from './game.gateway';

const roomId = 'abc';
const playerInfos: PlayerInfos = { roomId, username: 'usernameTest' };

describe('GameGateway', () => {
    let gateway: GameGateway;
    let logger: SinonStubbedInstance<Logger>;
    let gameService: SinonStubbedInstance<GameService>;
    let socket: SinonStubbedInstance<Socket>;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        gameService = createStubInstance(GameService);
        socket = socketMock('s');

        const module: TestingModule = await Test.createTestingModule({
            providers: [GameGateway, { provide: Logger, useValue: logger }, { provide: GameService, useValue: gameService }],
        }).compile();

        gateway = module.get<GameGateway>(GameGateway);
        gateway['server'] = createStubInstance(Server);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('create', () => {
        it('should return the room id if creation is successful', async () => {
            gameService.createGameRoom.resolves({ success: true, roomId });
            expect(await gateway.create(socket, {} as CreateRequest)).toEqual({ success: true, roomId });
        });

        it('should return null if creation returns null', async () => {
            gameService.createGameRoom.resolves({ success: false });
            expect((await gateway.create(socket, {} as CreateRequest)).success).toBeFalsy();
        });
    });

    describe('join', () => {
        it('should return game info when joining a room', () => {
            const joinResponse = { foo: 'bar' } as unknown as JoinResponse;
            gameService.join.returns(joinResponse);
            expect(gateway.join(socket, playerInfos)).toBe(joinResponse);
        });

        it("should return null when joining a room that doesn't exists", () => {
            gameService.join.returns(null);
            expect(gateway.join(socket, playerInfos)).toBe(null);
        });
    });

    it('verify mcq should forward call', () => {
        gateway.verifyMCQ(socket, [0]);
        expect(gameService.verifyMCQ.calledOnceWith(socket, [0])).toBeTruthy();
    });

    it('verify laq should forward call', () => {
        gateway.verifyLAQ(socket, 'coucou');
        expect(gameService.verifyLAQ.calledOnceWith(socket, 'coucou')).toBeTruthy();
    });

    it('should log connections', () => {
        gateway.handleConnection(socket);
        expect(logger.log.calledOnce).toBeTruthy();
    });

    it('should call leave and log on disconnection', () => {
        gateway.handleDisconnect(socket);
        expect(logger.log.calledOnce).toBeTruthy();
        expect(gameService.leave.calledOnceWith(socket)).toBeTruthy();
    });

    it('leave should forward call', () => {
        gateway.leave(socket);
        expect(gameService.leave.calledOnceWith(socket)).toBeTruthy();
    });
});
