/* eslint-disable max-lines */
import { GameRoom } from '@app/classes/game-room/game-room';
import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { ChatService } from '@app/services/chat/chat.service';
import { HistoryService } from '@app/services/history/history.service';
import { QuestionService } from '@app/services/question/question.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { playerMock } from '@app/utils/game-room-test-helpers';
import { broadcastMock, BroadcastOperatorMock, socketMock } from '@app/utils/socket-mock';
import { GAME_ROOM_ID_LEN, ORGANISER_NAME, SYSTEM_NAME } from '@common/constants';
import { CreateRequest, GameEvent, GameType, LeaveReason, PlayerInfos } from '@common/events';
import { History } from '@common/history';
import { Question } from '@common/question';
import { Quiz } from '@common/quiz';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { Server, Socket } from 'socket.io';
import { GameService, SystemMessage } from './game.service';
import { getDateString } from '@app/utils/date';

const quiz1 = { questions: [{} as Question], visibility: true } as Quiz;
const quiz2 = { questions: [{} as Question, {} as Question], visibility: true } as Quiz;
const username = 'player1';

describe('GameService', () => {
    jest.useFakeTimers();
    let service: GameService;
    let quizService: SinonStubbedInstance<QuizService>;
    let chatService: SinonStubbedInstance<ChatService>;
    let questionService: SinonStubbedInstance<QuestionService>;
    let server: SinonStubbedInstance<Server>;
    let broadcastSpy: BroadcastOperatorMock;
    let historyService: SinonStubbedInstance<HistoryService>;

    let roomId: string;
    let socket: SinonStubbedInstance<Socket>;

    const createRoom = async (type: GameType = GameType.Normal): Promise<string | null> => {
        return (roomId = (await service.createGameRoom({ type, quizId: 'a' }, server)).roomId);
    };

    const playerInfos = (): PlayerInfos => {
        return { roomId, username };
    };

    const getCreatedRoom = () => {
        return service['rooms'].get(roomId);
    };

    const expectValidRoom = (id: string | null) => {
        expect(id).toBeTruthy();
        expect(id.length).toEqual(GAME_ROOM_ID_LEN);
        expect(/^\d+$/.test(id)).toBeTruthy(); // https://stackoverflow.com/a/1779019
        expect(service['rooms'].get(id)).toBeTruthy();
    };

    const expectNoRoom = (id?: string) => {
        if (id) {
            expect(service['rooms'].has(id)).toBeFalsy();
        } else {
            expect(id).toBeUndefined();
        }
    };

    const playerIsInRoom = (player: Socket, id: string): boolean => {
        return service['players'].get(player.id) === id;
    };

    beforeEach(async () => {
        quizService = createStubInstance(QuizService);
        quizService.findOne.resolves(quiz1);

        chatService = createStubInstance(ChatService);

        questionService = createStubInstance(QuestionService);
        historyService = createStubInstance(HistoryService);

        socket = socketMock('s');
        server = createStubInstance<Server>(Server);

        broadcastSpy = broadcastMock();
        server.to.returns(broadcastSpy);
        socket.to.returns(broadcastSpy);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameService,
                { provide: QuizService, useValue: quizService },
                { provide: ChatService, useValue: chatService },
                { provide: QuestionService, useValue: questionService },
                { provide: Logger, useValue: createStubInstance(Logger) },
                { provide: Server, useValue: server },
                { provide: HistoryService, useValue: historyService },
            ],
        }).compile();

        service = module.get<GameService>(GameService);
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should be able to create a game room', async () => {
            expectValidRoom((await service.createGameRoom({ type: GameType.Normal, quizId: 'a' }, server)).roomId);
        });

        it('should be able to create a test room', async () => {
            expectValidRoom((await service.createGameRoom({ type: GameType.Test, quizId: 'a' }, server)).roomId);
        });

        it('should be able to create a random room', async () => {
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            questionService.countDocuments.resolves(5);
            questionService.findMultiple.resolves([{} as Question]);
            expectValidRoom((await service.createGameRoom({ type: GameType.Aleatoire, length: 5 }, server)).roomId);
        });

        describe('updateHistory', () => {
            let addSpy;
            let playedGame;

            beforeEach(async () => {
                addSpy = jest.spyOn(historyService, 'add');
                playedGame = {} as unknown as History;
            });

            it('should be able to call history service to add played normal Game', async () => {
                await createRoom();
                getCreatedRoom().emitGameOver(playedGame);
                expect(addSpy).toHaveBeenCalledTimes(1);
            });

            it('should not call history service to add played test Game', async () => {
                await createRoom(GameType.Test);
                getCreatedRoom().emitGameOver(playedGame);
                expect(addSpy).toHaveBeenCalledTimes(0);
            });
        });

        it('should return null if the room cannot be created (quiz does not exist)', async () => {
            quizService.findOne.resolves(null);
            const res = await service.createGameRoom({ quizId: 'a' } as CreateRequest, server);
            expect(res.success).toBeFalsy();
            expectNoRoom(res.roomId);
            expect(res.error).toBeTruthy();
        });

        it('should fail if the room is hidden', async () => {
            quizService.findOne.resolves({ visibility: false } as Quiz);
            const res = await service.createGameRoom({ quizId: 'a' } as CreateRequest, server);
            expect(res.success).toBeFalsy();
            expectNoRoom(res.roomId);
            expect(res.error).toBeTruthy();
        });

        it('should fail if less questions that asked', async () => {
            questionService.countDocuments.resolves(3);
            const res = await service.createGameRoom({ length: 5 } as CreateRequest, server);
            expect(res.success).toBeFalsy();
            expectNoRoom(res.roomId);
            expect(res.error).toBeTruthy();
        });

        it('should fail if quizid doesnt exist or length isnt provided', async () => {
            const res = await service.createGameRoom({} as CreateRequest, server);
            expect(res.success).toBeFalsy();
            expectNoRoom(res.roomId);
            expect(res.error).toBeTruthy();
        });

        it('should destroy the room if no one joined after some delay', async () => {
            await createRoom();
            const killSpy = jest.spyOn(getCreatedRoom(), 'kill');

            expect(jest.getTimerCount()).toBe(1);
            jest.runAllTimers();
            expect(jest.getTimerCount()).toBe(0);
            expectNoRoom(roomId);
            expect(killSpy).toBeCalledTimes(1);
        });
    });

    describe('join', () => {
        let joinSpy: jest.SpyInstance;

        beforeEach(async () => {
            await createRoom();
            joinSpy = jest.spyOn(getCreatedRoom().room, 'join');
        });

        it('should allow joining a room that exists and return game info', () => {
            expect(service.join(socket, playerInfos(), server).totalNumberOfQuestions).toEqual(quiz1.questions.length);
            expect(joinSpy).toBeCalledWith(socket, username);
            expect(playerIsInRoom(socket, roomId)).toBeTruthy();
        });

        it('should allow joining the same room and return game info', () => {
            expect(service.join(socket, playerInfos(), server).totalNumberOfQuestions).toEqual(quiz1.questions.length);
            expect(joinSpy).toBeCalledWith(socket, username);
            expect(playerIsInRoom(socket, roomId)).toBeTruthy();

            expect(service.join(socket, playerInfos(), server).totalNumberOfQuestions).toEqual(quiz1.questions.length);
            expect(joinSpy).toBeCalledWith(socket, username);
            expect(playerIsInRoom(socket, roomId)).toBeTruthy();
        });

        it("should not allow joining a room that doesn't exist", () => {
            const wrongPlayerInfos = { roomId: 'abcde', username: 'wrongPlayer' };
            expect(service.join(socket, wrongPlayerInfos, server).success).toBeFalsy();
            expect(playerIsInRoom(socket, roomId)).toBeFalsy();
            expect(playerIsInRoom(socket, wrongPlayerInfos.roomId)).toBeFalsy();
        });

        it("should switch the player's room if they try to join another room", async () => {
            service.join(socket, playerInfos(), server);
            expect(playerIsInRoom(socket, roomId)).toBeTruthy();

            quizService.findOne.resolves(quiz2);
            const roomId2 = (await service.createGameRoom({ type: GameType.Normal, quizId: 'a' }, server)).roomId;

            const playerInfosSwitch = { roomId: roomId2, username };
            expect(service.join(socket, playerInfosSwitch, server).totalNumberOfQuestions).toEqual(quiz2.questions.length);
            expect(playerIsInRoom(socket, roomId2)).toBeTruthy();
        });

        it('should prevent the room from being destroyed by a timeout', () => {
            expectValidRoom(roomId);
            const killSpy = jest.spyOn(service['rooms'].get(roomId), 'kill');
            service.join(socket, playerInfos(), server);
            expect(jest.getTimerCount()).toBe(1);
            jest.runAllTimers();
            expect(jest.getTimerCount()).toBe(0);
            expectValidRoom(roomId);
            expect(killSpy).not.toBeCalled();
        });

        it('should send the emit of a new player if the service is join', () => {
            service.join(socket, playerInfos(), server);
            expect(socket.to.calledOnceWith(roomId)).toBeTruthy();
            expect(broadcastSpy.emit.calledOnceWith(GameEvent.NewPlayer, username)).toBeTruthy();
        });
    });

    describe('leave', () => {
        let orgSocket: SinonStubbedInstance<Socket>;

        beforeEach(async () => {
            await createRoom();
            orgSocket = socketMock('org');
            orgSocket.to.returns(broadcastMock());
            service.join(orgSocket, { roomId, username: ORGANISER_NAME }, server);
            service.join(socket, playerInfos(), server);
            server.to.resetHistory();
            broadcastSpy.emit.resetHistory();
        });

        it('should let a player leave a room that exists', () => {
            service.leave(socket);
            expect(playerIsInRoom(socket, roomId)).toBeFalsy();
        });

        it("should not fail if a player that isn't in a room tries to leave", () => {
            expect(() => {
                service.leave(socketMock('a'));
            }).not.toThrow();
        });

        it('should destroy a room when the last player leaves', () => {
            expectValidRoom(roomId);
            const killSpy = jest.spyOn(service['rooms'].get(roomId), 'kill');
            expect(playerIsInRoom(socket, roomId)).toBeTruthy();
            service.leave(socket);
            service.leave(orgSocket);
            expectNoRoom(roomId);
            expect(playerIsInRoom(socket, roomId)).toBeFalsy();
            expect(killSpy).toBeCalled();
        });

        it('should not make the timeout fail if the last player already left', () => {
            expectValidRoom(roomId);
            service.leave(socket);
            service.leave(orgSocket);
            expectNoRoom(roomId);

            expect(jest.getTimerCount()).toBe(1);
            expect(jest.runAllTimers).not.toThrow();
            expect(jest.getTimerCount()).toBe(0);
        });

        Object.values(LeaveReason).forEach((reason) => {
            it(`should emit when a player leaves because ${reason}`, () => {
                service.leave(socket, reason);
                expect(server.to.calledOnceWith(roomId)).toBeTruthy();
                expect(broadcastSpy.emit.calledOnceWith(GameEvent.PlayerLeaving, { username: playerInfos().username, reason })).toBeTruthy();
            });
        });

        it('should emit system message event when a player gives up', () => {
            jest.spyOn(getCreatedRoom(), 'isPlaying').mockReturnValue(true);

            const onMessage = jest.fn().mockImplementation((systemMessage: SystemMessage) => {
                expect(systemMessage.room).toEqual(getCreatedRoom().room);
                expect(systemMessage.message.sender).toEqual(SYSTEM_NAME);
                expect(systemMessage.message.time).toEqual(getDateString());
                expect(systemMessage.message.content).toMatch(`.*${playerInfos().username}.*`);
            });

            const sub = service.onSystemMessage().subscribe(onMessage);

            service.leave(socket, LeaveReason.Voluntary);
            expect(onMessage).toHaveBeenCalledTimes(1);

            sub.unsubscribe();
        });

        it('should not send a system message when not playing', () => {
            jest.spyOn(getCreatedRoom(), 'isPlaying').mockReturnValue(false);
            service.leave(socket, LeaveReason.Voluntary);
            expect(chatService.sendMessage.notCalled).toBeTruthy();
        });

        it('should not send a system message when leaving involuntarily', () => {
            jest.spyOn(getCreatedRoom(), 'isPlaying').mockReturnValue(true);
            service.leave(socket, LeaveReason.OrganiserLeft);
            expect(chatService.sendMessage.notCalled).toBeTruthy();
        });

        it('should properly dispose of ressource when room empties itself', () => {
            const socket2 = socketMock('second');
            socket2.to.returns(broadcastSpy);
            service.join(socket2, { roomId, username: 'second' }, server);

            service['players'].set('random other player', 'random other room');
            service['rooms'].set('random other room', createStubInstance(GameRoom));

            // eslint-disable-next-line
            expect(service['players'].size).toEqual(4);
            jest.spyOn(getCreatedRoom().room, 'leave').mockImplementation(() => {
                jest.spyOn(getCreatedRoom().room, 'isEmpty').mockReturnValue(true);
            });
            service.leave(socket);

            expectNoRoom(roomId);
            expect(service['rooms'].has('random other room')).toBeTruthy();

            expect(service['players'].size).toEqual(1);
            expect(service['players'].has('random other player')).toBeTruthy();
        });
    });

    describe('verify mcq', () => {
        let verifySpy: jest.SpyInstance;

        beforeEach(async () => {
            await createRoom();
            service.join(socket, playerInfos(), server);
            verifySpy = jest.spyOn(getCreatedRoom(), 'verifyMCQ').mockImplementation(() => 0);
        });

        it("should allow calling verify on the player's room if it exists", () => {
            service.verifyMCQ(socket, []);
            expect(verifySpy).toBeCalledWith(socket, []);
        });

        it("should not fail if the player's room doesn't exist", () => {
            expect(() => {
                service.verifyMCQ(socketMock('a'), []);
            }).not.toThrow();
        });
    });

    describe('verify laq', () => {
        let verifySpy: jest.SpyInstance;

        beforeEach(async () => {
            await createRoom();
            service.join(socket, playerInfos(), server);
            verifySpy = jest.spyOn(getCreatedRoom(), 'verifyLAQ').mockImplementation(() => 0);
        });

        it("should allow calling verify on the player's room if it exists", () => {
            service.verifyLAQ(socket, 'm');
            expect(verifySpy).toBeCalledWith(socket, 'm');
        });

        it("should not fail if the player's room doesn't exist", () => {
            expect(() => {
                service.verifyLAQ(socketMock('a'), 'm');
            }).not.toThrow();
        });
    });

    describe('getPlayer', () => {
        it('should return the Player if it can be found in a room', () => {
            const room1 = createStubInstance(Room<Player>);
            room1.getMembers.returns([playerMock('a')]);
            const room2 = createStubInstance(Room<Player>);
            room2.getMembers.returns([playerMock('b')]);

            jest.spyOn(service['rooms'], 'forEach').mockImplementation((callback) => {
                [room1, room2].forEach((r) => callback({ room: r } as unknown as GameRoom, undefined, undefined));
            });

            expect(service.getPlayer(room1.getMembers()[0].username)).toBe(room1.getMembers()[0]);
        });

        it('should return undefined if it cannot be found in a room', () => {
            const room1 = createStubInstance(Room<Player>);
            room1.getMembers.returns([playerMock('a')]);
            const room2 = createStubInstance(Room<Player>);
            room2.getMembers.returns([playerMock('b')]);

            jest.spyOn(service['rooms'], 'forEach').mockImplementation((callback) => {
                [room1, room2].forEach((r) => callback({ room: r } as unknown as GameRoom, undefined, undefined));
            });

            expect(service.getPlayer('blabla')).toBeUndefined();
        });
    });
});
