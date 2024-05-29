/* eslint-disable max-lines */
import { HttpStatusCode } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DialogService } from '@app/services/dialog/dialog.service';
import { GlobalService } from '@app/services/global/global.service';
import { SocketService } from '@app/services/socket/socket.service';
import { globalMock } from '@app/utils/global-test-helper';
import { EventEmitFunc, mockServerResponse, socketServiceMock } from '@app/utils/socket-test-helpers';
import { N_QUESTIONS_RANDOM_MODE, ORGANISER_NAME } from '@common/constants';
import {
    CreateRequest,
    CreateResponse,
    GameEvent,
    GameResults,
    GameType,
    Grade,
    JoinResponse,
    Leaderboard,
    LeaderboardEntry,
    LeaveDescription,
    LeaveReason,
    OrganiserEvent,
    PlayerInfos,
} from '@common/events';
import { Quiz } from '@common/quiz';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GameInfo, GameService, State } from './game.service';

const roomId = 'abc1';
const baseUrl: string = environment.serverUrl;

describe('GameService', () => {
    let service: GameService;
    let socketSpy: jasmine.SpyObj<SocketService>;
    let global: jasmine.SpyObj<GlobalService>;
    let dialog: jasmine.SpyObj<DialogService>;
    let router: jasmine.SpyObj<Router>;
    let emulateServerEvent: EventEmitFunc;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        [global, , dialog, router] = globalMock();
        [socketSpy, emulateServerEvent] = socketServiceMock();

        TestBed.configureTestingModule({
            providers: [
                { provide: SocketService, useValue: socketSpy },
                { provide: GlobalService, useValue: global },
            ],
            imports: [HttpClientTestingModule],
        });

        service = TestBed.inject(GameService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should try to connect', () => {
        expect(socketSpy.connect).toHaveBeenCalled();
    });

    it('should provide the list of the players for the current game', () => {
        expect(service.getPlayers()).toEqual([]);
    });

    it('should allow leaving', () => {
        service.leave();
        expect(socketSpy.send).toHaveBeenCalledOnceWith(GameEvent.Leave);
    });

    describe('join', () => {
        it('should call send of the service', () => {
            const playerInfos: PlayerInfos = { roomId: 'testRoomId', username: 'testUsername' };
            const expectedResponse: JoinResponse = { success: true };

            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Join, expectedResponse));

            const callback = (res: boolean) => {
                expect(res).toEqual(expectedResponse.success);
            };

            service.join(playerInfos, callback);
            expect(service.getJoinResponse()).toEqual(expectedResponse);
            expect(socketSpy.send).toHaveBeenCalledTimes(1);
        });

        it('should alert if failed', () => {
            const playerInfos: PlayerInfos = { roomId: 'testRoomId', username: 'testUsername' };
            const expectedResponse = { success: false, error: 'bla' };

            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Join, expectedResponse));

            const callback = (res: boolean) => {
                expect(res).toEqual(expectedResponse.success);
            };

            service.join(playerInfos, callback);
            expect(socketSpy.send).toHaveBeenCalledTimes(1);
            expect(dialog.alert).toHaveBeenCalledOnceWith(expectedResponse.error);
        });

        it('should set game code and username when joining', () => {
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Join, {} as JoinResponse));
            const playerInfos: PlayerInfos = { roomId: 'room', username: 'name' };
            service.join(playerInfos, () => 0);
            expect(service.isOrganiser()).toBeFalse();
            expect(service.gameCode()).toBe(playerInfos.roomId);
            expect(service.getMyName()).toBe(playerInfos.username);
        });
    });

    describe('creating', () => {
        it('should set game code and username when creating', () => {
            const createResponse = { success: true, roomId: 'room' };
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Create, createResponse));
            service['createGameRoom']({} as CreateRequest).subscribe();
            expect(service.isOrganiser()).toBeTrue();
            expect(service.gameCode()).toBe(createResponse.roomId);
            expect(service.getMyName()).toBe(ORGANISER_NAME);
        });
    });

    describe('check room exists', () => {
        it('should return OK if the room exists', () => {
            service.checkRoomExists(roomId).subscribe();
            const req = httpMock.expectOne(`${baseUrl}/${roomId}`);
            expect(req.request.method).toBe('GET');
            req.flush(true, { status: HttpStatusCode.Ok, statusText: 'CREATED OK' });
        });

        it('should return NOT FOUND if the room doesnt exists', () => {
            const wrongId = '123';
            service.checkRoomExists(wrongId).subscribe();
            const req = httpMock.expectOne(`${baseUrl}/${wrongId}`);
            expect(req.request.method).toBe('GET');
            req.flush(false, { status: HttpStatusCode.NotFound, statusText: 'NOT FOUND' });
        });
    });

    describe('game info', () => {
        const joinResponse: JoinResponse = { success: true, title: 'toto', totalNumberOfQuestions: 666 };

        it('should provide game info after joining', () => {
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Join, joinResponse));
            service.join({} as PlayerInfos, () => 0);
            expect(service.getGameInfo()).toEqual({ title: joinResponse.title, numberOfQuestions: joinResponse.totalNumberOfQuestions } as GameInfo);
        });

        it('should provide game info after creating', () => {
            const createResponse: CreateResponse = { success: true, joinResponse };
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Create, createResponse));
            service.createGame({} as Quiz).subscribe();
            expect(service.getGameInfo()).toEqual({ title: joinResponse.title, numberOfQuestions: joinResponse.totalNumberOfQuestions } as GameInfo);
        });

        it('should provide game info after creating test game', () => {
            const createResponse: CreateResponse = { success: true, joinResponse };
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Create, createResponse));
            service.testGame({} as Quiz).subscribe();
            expect(service.getGameInfo()).toEqual({ title: joinResponse.title, numberOfQuestions: joinResponse.totalNumberOfQuestions } as GameInfo);
        });

        it('should provide game info after creating random mode game', () => {
            const createResponse: CreateResponse = { success: true, joinResponse };
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Create, createResponse));
            service.playRandomGame(N_QUESTIONS_RANDOM_MODE).subscribe();
            expect(service.getGameInfo()).toEqual({ title: joinResponse.title, numberOfQuestions: joinResponse.totalNumberOfQuestions } as GameInfo);
        });

        it('should provide default game info if joining/creating fails', () => {
            service['joinResponse'] = { success: false };
            expect(service.getGameInfo().title).toBeDefined();
            expect(service.getGameInfo().numberOfQuestions).toBeDefined();
        });
    });

    describe('players', () => {
        describe('leaving', () => {
            const playerLeave = (username: string, reason: LeaveReason = LeaveReason.Voluntary) => {
                emulateServerEvent(GameEvent.PlayerLeaving, { username, reason } as LeaveDescription);
            };

            it('should listen for players leaving', () => {
                expect(service.getPlayers()).toEqual([]);
                emulateServerEvent(GameEvent.NewPlayer, 'a');
                emulateServerEvent(GameEvent.NewPlayer, 'b');
                expect(service.getPlayers()).toEqual(['a', 'b']);

                playerLeave('b');
                expect(service.getPlayers()).toEqual(['a']);
                playerLeave('a');
                expect(service.getPlayers()).toEqual([]);
            });

            it('isGameOver and getGameResults should return based on gameResult', () => {
                [{} as GameResults, null].forEach((g) => {
                    service['gameResults'] = g;
                    expect(service.getGameResults()).toEqual(g);
                    expect(service.isGameOver()).toEqual(!!g);
                });
            });

            it('onLeaderboard should return subject', () => {
                const fakeSubject = {} as unknown as Subject<LeaderboardEntry[]>;
                service['leaderboardSubject'] = fakeSubject;
                expect(service.onLeaderboard()).toEqual(fakeSubject);
            });

            it('onGameOver should return subject', () => {
                const fakeSubject = {} as unknown as Subject<void>;
                service['gameOverSubject'] = fakeSubject;
                expect(service.onGameOver()).toEqual(fakeSubject);
            });

            describe('when self is leaving', () => {
                const username = 'abc';

                beforeEach(() => {
                    socketSpy.send.and.callFake(mockServerResponse(GameEvent.Join, { success: true }));
                    service.join({ username } as PlayerInfos, () => 0);
                });

                it('should not alert or navigate if another player is leaving', () => {
                    playerLeave('not me', LeaveReason.Banned);
                    expect(dialog.alert).not.toHaveBeenCalled();
                    expect(router.navigate).not.toHaveBeenCalled();
                });

                it('should do nothing if player left voluntarily', () => {
                    playerLeave(username);
                    expect(dialog.alert).not.toHaveBeenCalled();
                    expect(router.navigate).not.toHaveBeenCalled();
                });

                it('should alert if this player is removed from the game', () => {
                    playerLeave(username, LeaveReason.Banned);
                    expect(dialog.alert).toHaveBeenCalledTimes(1);
                    expect(router.navigate).toHaveBeenCalledOnceWith(['/home']);
                });

                it("should alert if this player's organiser left the game", () => {
                    playerLeave(username, LeaveReason.OrganiserLeft);
                    expect(dialog.alert).toHaveBeenCalledTimes(1);
                    expect(router.navigate).toHaveBeenCalledOnceWith(['/home']);
                });

                it('should alert the organiser if all players left the game', () => {
                    playerLeave(username, LeaveReason.AllPlayersLeft);
                    expect(dialog.alert).toHaveBeenCalledTimes(1);
                    expect(router.navigate).toHaveBeenCalledOnceWith(['/home']);
                });
            });
        });

        it('should recognize the player as self', () => {
            const username = 'abc';
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Join, {}));
            service.join({ username } as PlayerInfos, () => 0);
            expect(service.isMe(username)).toBeTrue();
            expect(service.isMe('foo')).toBeFalse();
        });

        it('should give my name', () => {
            const username = 'abc';
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Join, {}));
            service.join({ username } as PlayerInfos, () => 0);
            expect(service.getMyName()).toBe(username);
        });

        it('should listen for new players', () => {
            expect(service.getPlayers()).toEqual([]);
            emulateServerEvent(GameEvent.NewPlayer, 'a');
            expect(service.getPlayers()).toEqual(['a']);
        });

        it('should listen to evaluations for game in normal mode', () => {
            service['gameMode'] = GameType.Normal;
            expect(service.getAnswersToEvaluate()).toEqual([]);
            emulateServerEvent(GameEvent.Evaluating, [{ username: 'a', answers: 'ok' }]);
            expect(service.getState()).toEqual(State.Evaluation);
            expect(service.getAnswersToEvaluate()).toEqual([{ username: 'a', answers: 'ok' }]);
        });

        it('should listen to evaluations for game in test mode', () => {
            service['gameMode'] = GameType.Test;
            const gradeInTestMode: Grade[] = [{ username: 'Organisateur', grade: 100 }];
            emulateServerEvent(GameEvent.Evaluating, [{ username: 'a', answers: 'ok' }]);
            expect(service.getState()).toEqual(State.Wait);
            expect(socketSpy.send).toHaveBeenCalledWith(OrganiserEvent.sendResults, gradeInTestMode);
        });

        it('should reset players when creating a game', () => {
            service['players'] = ['a'];
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Create, {}));
            service['createGameRoom']({} as unknown as CreateRequest).subscribe();
            expect(service.getPlayers()).toEqual([]);
        });

        it('should reset players when joining a game', () => {
            emulateServerEvent(GameEvent.NewPlayer, 'a');
            emulateServerEvent(GameEvent.NewPlayer, 'b');
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Join, {}));
            service.join({} as PlayerInfos, () => 0);
            expect(service.getPlayers()).toEqual([]);
        });

        it('should load players when joining', () => {
            const members = ['a', 'b'];
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Join, { members }));
            service.join({} as PlayerInfos, () => 0);
            expect(service.getPlayers()).toEqual(members);
        });
    });

    describe('states', () => {
        it('should get the state', () => {
            service['state'] = State.Present;
            expect(service.getState()).toEqual(State.Present);
        });

        it('should reset state to Wait when joining', () => {
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Join, { success: true }));
            service['state'] = State.Result;
            service.join({} as unknown as PlayerInfos, () => 0);
            expect(service.getState()).toBe(State.Wait);
        });

        it('should reset state to Wait when creating', () => {
            socketSpy.send.and.callFake(mockServerResponse(GameEvent.Create, { success: true }));
            service['state'] = State.Result;
            service['createGameRoom']({} as CreateRequest).subscribe();
            expect(service.getState()).toBe(State.Wait);
        });

        it('should change state to Present on ShowPresentation event', () => {
            service['state'] = State.Wait;
            emulateServerEvent(GameEvent.ShowPresentation);
            expect(service['state']).toEqual(State.Present);
        });

        it('should change state to Play on NewQuestion event', () => {
            service['state'] = State.Present;
            emulateServerEvent(GameEvent.NewQuestion);
            expect(service['state']).toEqual(State.Play);
        });

        it('should change state to Result on Gameover event', () => {
            service['state'] = State.Play;
            emulateServerEvent(GameEvent.Gameover);
            expect(service['state']).toEqual(State.Result);
        });

        it('should call next on Leaderboard Send event', () => {
            let res = 'foo';
            service.onLeaderboard().subscribe(() => {
                res = 'bar';
            });
            emulateServerEvent(Leaderboard.send);
            expect(res).toEqual('bar');
        });
    });
});
