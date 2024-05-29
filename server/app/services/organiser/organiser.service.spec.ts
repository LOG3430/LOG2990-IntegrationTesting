import { GameRoom } from '@app/classes/game-room/game-room';
import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { GameService } from '@app/services/game/game.service';
import { playerMock } from '@app/utils/game-room-test-helpers';
import { BroadcastOperatorMock, broadcastMock, socketMock } from '@app/utils/socket-mock';
import { Grade, Leaderboard, MessageEvent } from '@common/events';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, match } from 'sinon';
import { Server, Socket } from 'socket.io';
import { OrganiserService } from './organiser.service';

const socket = socketMock('org');

describe('OrganiserService', () => {
    let service: OrganiserService;
    let gameService: SinonStubbedInstance<GameService>;
    let gameRoom: SinonStubbedInstance<GameRoom>;
    let server: SinonStubbedInstance<Server>;
    let room: SinonStubbedInstance<Room<Player>>;
    let broadcastSpy: BroadcastOperatorMock;

    beforeEach(async () => {
        room = createStubInstance(Room<Player>);

        gameRoom = createStubInstance(GameRoom);
        gameRoom.room = room;

        gameService = createStubInstance(GameService);
        gameService.getGameRoom.returns(gameRoom);

        server = createStubInstance<Server>(Server);

        broadcastSpy = broadcastMock();
        socket.to.returns(broadcastSpy);

        const module: TestingModule = await Test.createTestingModule({
            providers: [OrganiserService, { provide: GameService, useValue: gameService }, { provide: Server, useValue: server }],
        }).compile();

        service = module.get<OrganiserService>(OrganiserService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('isOrganiser', () => {
        it('should ask the room to check if is organiser', () => {
            [true, false].forEach((isOrganiser) => {
                room.isOrganiser.returns(isOrganiser);
                expect(service.isOrganiser(socket)).toBe(isOrganiser);
                expect(room.isOrganiser.calledOnceWith(socket)).toBeTruthy();
                room.isOrganiser.resetHistory();
            });
        });

        it('should not fail if no game room is associated with the socket', () => {
            gameService.getGameRoom.returns(undefined);
            expect(service.isOrganiser(socket)).toBeFalsy();
        });
    });

    describe('toggleRoomLock', () => {
        it('should ask the room to toggleLock', () => {
            [true, false].forEach((locked) => {
                room.toggleLock.returns(locked);
                expect(service.toggleRoomLock(socket)).toBe(locked);
                expect(room.toggleLock.calledOnce).toBeTruthy();
                room.toggleLock.resetHistory();
            });
        });

        it('should not fail if no game room is associated with the socket', () => {
            gameService.getGameRoom.returns(undefined);
            expect(() => service.toggleRoomLock(socket)).not.toThrow();
        });
    });

    describe('nextquestion', () => {
        it('should make the gameroom ready for next question', () => {
            service.nextQuestion(socket);
            expect(gameRoom.ready.calledOnceWith(socket)).toBeTruthy();
        });

        it('should not fail if there is no room', () => {
            gameService.getGameRoom.returns(undefined);
            expect(() => {
                service.nextQuestion(socket);
            }).not.toThrow();
        });
    });

    describe('go to next question', () => {
        it("should allow calling ready on the player's room if it exists", () => {
            service.nextQuestion(socket);
            expect(gameRoom.ready.calledOnceWith(socket)).toBeTruthy();
        });

        it("should not fail if the player's room doesn't exist", () => {
            gameService.getGameRoom.returns(undefined);
            expect(() => {
                service.nextQuestion(socket);
            }).not.toThrow();
        });
    });

    describe('go to game results', () => {
        it("should allow calling ready on the player's room if it exists", () => {
            service.goToGameResults(socket);
            expect(gameRoom.ready.calledOnceWith(socket)).toBeTruthy();
        });

        it("should not fail if the player's room doesn't exist", () => {
            gameService.getGameRoom.returns(undefined);
            expect(() => {
                service.goToGameResults(socket);
            }).not.toThrow();
        });

        it('should call the room go to LAQ results on sendCorrectionToRoom', () => {
            const grades: Grade[] = [];
            service.sendCorrectionToRoom(socket, grades);
            expect(gameRoom.goToLAQResults.calledOnceWith(socket, grades)).toBeTruthy();
        });

        it('should not go to LAQ results when there is no room', () => {
            const grades: Grade[] = [];
            gameService.getGameRoom.returns(undefined);
            service.sendCorrectionToRoom(socket, grades);
            expect(gameRoom.goToLAQResults.calledOnceWith(socket, grades)).toBeFalsy();
        });
    });

    describe('kickout', () => {
        it('should make the player leave if he is found', () => {
            const p = playerMock('p');
            gameService.getPlayer.returns(p);
            service.kickout('p');
            expect(gameService.leave.calledOnceWith(p.getSocket())).toBeTruthy();
        });

        it('should do nothing if the player is not found', () => {
            gameService.getPlayer.returns(null);
            service.kickout('p');
            expect(gameService.leave.notCalled).toBeTruthy();
        });

        it('should not fail if the player is not in a room', () => {
            gameService.getGameRoom.returns(null);
            service.kickout('p');
            expect(gameService.leave.notCalled).toBeTruthy();
        });
    });

    describe('mute', () => {
        let p: Player;

        beforeEach(() => {
            p = playerMock('p');
            gameRoom.getPlayerByName.returns(p);
        });

        it('should toggle the mute status of the player if he is found', () => {
            service.mutePlayer(socket, 'p');
            expect(p.isMuted).toBe(true);

            service.mutePlayer(socket, 'p');
            expect(p.isMuted).toBe(false);

            service.mutePlayer(socket, 'p');
            expect(p.isMuted).toBe(true);
        });

        it('should mute the player if he is found', () => {
            gameRoom.getLeaderboard.callsFake(() => {
                expect(p.isMuted).toBe(true);
                return [];
            });

            service.mutePlayer(socket, 'p');
            expect(p.isMuted).toBe(true);
            expect(room.toOrganiser.calledOnceWith(Leaderboard.send, [])).toBeTruthy();
            expect(gameRoom.getLeaderboard.calledOnce).toBeTruthy();
            expect((p.getSocket() as SinonStubbedInstance<Socket>).emit.calledOnceWith(MessageEvent.Muted, true)).toBeTruthy();
        });

        it('should send system message', () => {
            expect(p.isMuted).toBe(false);
            service.mutePlayer(socket, 'p');
            expect(gameService.sendSystemMessage.calledWith(room, match(`${p.username}`)));

            gameService.sendSystemMessage.resetHistory();
            expect(p.isMuted).toBe(true);
            service.mutePlayer(socket, 'p');
            expect(gameService.sendSystemMessage.calledWith(room, match(`${p.username}`)));
        });

        it('should do nothing if the player is not found', () => {
            gameRoom.getPlayerByName.returns(null);
            service.mutePlayer(socket, 'p');
            expect(room.toOrganiser.notCalled).toBeTruthy();
        });

        it('should not fail if the player is not in a room', () => {
            gameService.getGameRoom.returns(null);
            expect(() => service.mutePlayer(socket, 'p')).not.toThrow();
        });
    });

    describe('start', () => {
        it("should call start on the organiser's room if it exists", () => {
            service.start(socket);
            expect(gameRoom.startGame.calledOnceWith(socket)).toBeTruthy();
        });

        it("should not fail if the organiser's room doesn't exist", () => {
            gameService.getGameRoom.returns(undefined);
            expect(() => {
                service.start(socket);
            }).not.toThrow();
        });
    });

    describe('timer', () => {
        describe('pause', () => {
            it("should call pause on organiser's room if it exists", () => {
                service.pause(socket);
                expect(gameRoom.pauseTimer.calledOnce).toBeTruthy();
            });

            it("should not fail if the organiser's room doesn't exists", () => {
                gameService.getGameRoom.returns(undefined);
                expect(() => {
                    service.pause(socket);
                }).not.toThrow();
            });
        });

        describe('panic', () => {
            it("should call panic on organiser's room if it exists", () => {
                service.panic(socket);
                expect(gameRoom.panicTimer.calledOnce).toBeTruthy();
            });

            it("should not fail if the organiser's room doesn't exists", () => {
                gameService.getGameRoom.returns(undefined);
                expect(() => {
                    service.panic(socket);
                }).not.toThrow();
            });
        });
    });
});
