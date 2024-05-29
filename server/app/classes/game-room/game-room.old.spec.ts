/* eslint-disable max-lines */

import { Factory, gameStateTable } from '@app/classes/game-states/factory/factory';
import { GameState } from '@app/classes/game/game';
import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { Verificator } from '@app/classes/verificator/verificator';
import {
    GameContext,
    POINTS,
    gameQuestion,
    inspect,
    msDuration,
    playerMock,
    question,
    quiz,
    spyOnPrivate,
    startDateTime,
} from '@app/utils/game-room-test-helpers';
import { socketMock } from '@app/utils/socket-mock';
import { GameEvent } from '@common/events';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Socket } from 'socket.io';
import { GameRoom } from './game-room';
import { QTypes } from '@common/question-type';

describe('GameRoom', () => {
    jest.useFakeTimers();
    let room: SinonStubbedInstance<Room<Player>>;
    let gameroom: GameRoom;
    let organiser: SinonStubbedInstance<Socket>;
    let gameContext: GameContext;
    const factory = new Factory(gameStateTable);

    beforeEach(() => {
        room = createStubInstance<Room<Player>>(Room);
        gameroom = new GameRoom(quiz, room, factory);
        organiser = socketMock('a');
        gameContext = new GameContext(room, gameroom);
        jest.setSystemTime(startDateTime);
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it('the date should be faked for tests', () => {
        expect(new Date().getTime()).toEqual(startDateTime);
        const offset = 10;
        jest.advanceTimersByTime(offset);
        expect(new Date().getTime()).toEqual(startDateTime + offset);
    });

    it('should be defined', () => {
        expect(gameroom).toBeDefined();
    });

    it('should provide game info to whatever room.join gives', () => {
        room.join.returns({ success: false, error: 'blabla' });
        expect(gameroom.join(socketMock('bla'), 'name')).toEqual({
            success: false,
            error: 'blabla',
            totalNumberOfQuestions: quiz.questions.length,
            title: quiz.title,
        });
    });

    it('should be killable', () => {
        gameroom.kill();
        expect(inspect(gameroom).state).toBe(GameState.Over);
    });

    describe('Joining State', () => {
        it('should be the initial state', () => {
            expect(inspect(gameroom).state).toBe(GameState.Joining);
        });

        it('should not do anything when verify is called', () => {
            const verifSpy = jest.spyOn(Verificator, 'verifyMCQ');
            gameroom.verifyMCQ(socketMock(''), [0]);
            expect(verifSpy).not.toHaveBeenCalled();
        });

        it('should not do anything when ready is called', () => {
            inspect(gameroom).isReadyForNextQuestion = false;
            room.isOrganiser.returns(true);
            gameroom.ready(organiser);
            expect(inspect(gameroom).isReadyForNextQuestion).toBeFalsy();
        });

        describe('starting', () => {
            describe('effects', () => {
                let canStartSpy: jest.SpyInstance;
                let onStartSpy: jest.SpyInstance;

                beforeEach(() => {
                    canStartSpy = spyOnPrivate(gameroom, 'canStart');
                    onStartSpy = spyOnPrivate(gameroom, 'onStart');
                });

                it('should not call present if not canStart', () => {
                    canStartSpy.mockReturnValue(false);
                    gameroom.startGame(organiser);
                    expect(room.toAll.notCalled).toBeTruthy();
                    expect(gameroom.game.state).toBe(GameState.Joining);
                    expect(onStartSpy).not.toHaveBeenCalled();
                });

                it('should call start with delay if canStart', () => {
                    canStartSpy.mockReturnValue(true);
                    gameroom.startGame(organiser);
                    expect(room.toAll.calledWith(GameEvent.ShowPresentation)).toBeTruthy();
                    expect(gameroom.game.state).toBe(GameState.Presentation);
                    expect(onStartSpy).toHaveBeenCalled();

                    expect(jest.getTimerCount()).toBe(1);
                    room.getMembers.returns([]);
                    while (gameroom.game.state !== GameState.Answering) {
                        jest.runOnlyPendingTimers();
                    }

                    expect(gameroom.game.state).toBe(GameState.Answering);
                });
            });

            describe('can start', () => {
                beforeEach(() => {
                    room.isOrganiser.returns(true);
                    room.getMembers.returns([playerMock('a')]);
                    room.isUnlocked.returns(false);
                });

                it('should be able to start only if the organiser is the caller, there is at least 1 player and the room is not locked', () => {
                    expect(gameroom['canStart'](organiser)).toBeTruthy();
                });

                it('should not be able to start if already started', () => {
                    inspect(gameroom).receivedStart = true;
                    expect(gameroom['canStart'](organiser)).toBeFalsy();
                });

                it('should not be able to start if not organiser', () => {
                    room.isOrganiser.returns(false);
                    expect(gameroom['canStart'](organiser)).toBeFalsy();
                });

                it('should not be able to start if less than 1 player', () => {
                    room.getMembers.returns([]);
                    expect(gameroom['canStart'](organiser)).toBeFalsy();
                });

                it('should not be able to start if room is unlocked', () => {
                    room.isUnlocked.returns(true);
                    expect(gameroom['canStart'](organiser)).toBeFalsy();
                });
            });

            it('should change state when started by the organiser', () => {
                gameContext.runToState(GameState.Answering, false);

                expect(inspect(gameroom).receivedStart).toBeTruthy();
                expect(inspect(gameroom).state).toBe(GameState.Answering);
                expect(room.toAll.calledWith(GameEvent.NewQuestion, gameQuestion(0))).toBeTruthy();
                expect(room.setTerminateWhenNoPlayers.called).toBeTruthy();
                expect(inspect(gameroom).timer.remaining()).toEqual(msDuration());
                expect(inspect(gameroom).isReadyForNextQuestion).toBeFalsy();
                expect(gameroom.allPlayersAnswered()).toBeFalsy();
            });

            it('should stay in this state until explicitly started even if update is called forcefully', () => {
                room.getMembers.returns([]);
                gameroom['update']();
                expect(inspect(gameroom).state).toBe(GameState.Joining);
            });
        });
    });

    describe('Answering State', () => {
        const verifMCQSpy = jest.spyOn(Verificator, 'verifyMCQ');
        const verifLAQSpy = jest.spyOn(Verificator, 'verifyLAQ');
        let questionStartTime: number;

        beforeEach(() => {
            gameContext.runToState(GameState.Answering);
            questionStartTime = new Date().getTime();
            room.toAll.resetHistory();
        });

        afterEach(() => {
            verifMCQSpy.mockReset();
            verifLAQSpy.mockReset();
        });

        it('should stop updating when killed', () => {
            expect(jest.getTimerCount()).toBe(1);
            gameroom.kill();
            expect(inspect(gameroom).state).toBe(GameState.Over);
            expect(jest.getTimerCount()).toBe(0);
        });

        it('should keep the answering state when started', () => {
            room.isOrganiser.returns(true);
            room.getMembers.returns([]);
            gameroom.startGame(organiser);

            expect(inspect(gameroom).state).toBe(GameState.Answering);
            expect(room.toAll.called).toBeFalsy();
        });

        it("should verify the player's answers when verify is called", () => {
            const playerSpy = playerMock('p');
            room.getMembers.returns([playerSpy]);
            room.getMember.returns(playerSpy);
            gameroom.verifyMCQ(playerSpy.getSocket(), []);

            expect(playerSpy.infos.time).toEqual(Date.now());
            expect(playerSpy.infos.answers).toEqual([]);
        });

        it('should not verify nor fail if there is no associated player when verifyMCQ is called', () => {
            room.getMember.returns(undefined);
            gameroom.verifyMCQ(socketMock(''), [0]);
            expect(verifMCQSpy).not.toHaveBeenCalled();
        });

        it('should not verify nor fail if there is no associated player when verifyLAQ is called', () => {
            room.getMember.returns(undefined);
            gameroom.verifyLAQ(socketMock(''), '');
            expect(verifLAQSpy).not.toHaveBeenCalled();
        });

        it('should set member infos and call addLAQ when there is a member associated', () => {
            const playerSpy = playerMock('p');
            room.getMembers.returns([playerSpy]);
            room.getMember.returns(playerSpy);
            gameroom['isInVerifyState'] = jest.fn().mockReturnValue(true);
            gameroom.verifyLAQ(playerSpy.getSocket(), 'a');
            expect(playerSpy.infos.answers).toEqual('a');
            expect(playerSpy.infos.time).toEqual(Date.now());
        });

        it('should submit events when every players answered', () => {
            const clearIntervalSpy = spyOnPrivate(gameroom, 'clearInterval').mockImplementation();
            const p = playerMock('p');
            p.infos = { time: Date.now(), answers: 'a' };
            room.getMember.returns(p);
            room.getMembers.returns([p]);

            const currentImpl = gameroom.game.getCurrentQuestion;
            gameroom.game.getCurrentQuestion = () => ({ ...currentImpl.bind(gameroom.game), type: QTypes.LAQ });

            gameroom.verifyLAQ(p.getSocket(), 'bla');

            expect(room.toOrganiser.calledWith(GameEvent.Evaluating, [{ username: p.username, answers: p.infos.answers }])).toBeTruthy();
            expect(room.toMembers.calledOnceWith(GameEvent.QuestionEvaluation));
            expect(clearIntervalSpy).toHaveBeenCalled();
        });

        it('should not do anything when ready is called', () => {
            inspect(gameroom).isReadyForNextQuestion = false;
            room.isOrganiser.returns(true);
            gameroom.ready(organiser);
            expect(inspect(gameroom).isReadyForNextQuestion).toBeFalsy();
        });

        it('should emit tick events with time remaining when not all players have answered', () => {
            room.getMembers.returns([playerMock('')]);
            expect(jest.getTimerCount()).toEqual(1);
            jest.runOnlyPendingTimers();

            expect(room.toAll.calledOnce).toBeTruthy();
            const elapsed = new Date().getTime() - questionStartTime;
            expect(room.toAll.calledOnceWith(GameEvent.Tick, msDuration() - elapsed)).toBeTruthy();
        });

        it('should emit tick events until time is up, then timeout into showing answers', () => {
            room.getMembers.returns([playerMock('')]);
            expect(jest.getTimerCount()).toEqual(1);

            let elapsed = 0;
            while (elapsed < msDuration()) {
                jest.runOnlyPendingTimers();
                elapsed = new Date().getTime() - questionStartTime;
                const timeRemaining = msDuration() - elapsed;
                if (timeRemaining > 0) {
                    expect(room.toAll.calledOnceWith(GameEvent.Tick, Math.max(0, timeRemaining))).toBeTruthy();
                } else {
                    expect(room.toAll.calledWith(GameEvent.Tick, 0)).toBeTruthy();
                }
                room.toAll.resetHistory();
            }

            expect(inspect(gameroom).state).toBe(GameState.ShowingAnswers);
            expect(jest.getTimerCount()).toEqual(0);
        });
    });

    describe('ShowingAnswers State', () => {
        beforeEach(() => {
            gameContext.runToState(GameState.ShowingAnswers);
        });

        it('should return to Answering state once the organiser is ready, after a delay', () => {
            room.getMembers.returns([playerMock('a')]);
            room.isOrganiser.returns(true);

            gameroom.ready(organiser);
            jest.runOnlyPendingTimers();

            expect(inspect(gameroom).state).toBe(GameState.Answering);
            expect(inspect(gameroom).isReadyForNextQuestion).toBeFalsy();
            expect(room.toAll.calledOnceWith(GameEvent.NewQuestion, gameQuestion(1)));
        });

        it('should go to game over state once out of questions, after a delay', () => {
            inspect(gameroom).quiz.questions = [question(POINTS, []), question(POINTS, [])];
            room.isOrganiser.returns(true);
            room.getMembers.returns([]);

            gameroom.ready(organiser);
            jest.runOnlyPendingTimers();

            expect(inspect(gameroom).state).toBe(GameState.Answering);
            gameContext.runToState(GameState.ShowingAnswers, false);

            room.toAll.resetHistory();
            gameroom.ready(organiser);
            jest.runOnlyPendingTimers();

            expect(inspect(gameroom).state).toBe(GameState.Over);
            expect(room.toAll.calledOnceWith(GameEvent.Gameover));
        });
    });

    describe('Over State', () => {
        beforeEach(() => {
            gameContext.runToState(GameState.Over);
        });

        it('should be asleep', () => {
            expect(jest.getTimerCount()).toEqual(0);
        });

        it('should stay over even if update if called forcefully', () => {
            room.getMembers.returns([]);
            gameroom['update']();
            expect(inspect(gameroom).state).toBe(GameState.Over);
        });
    });
});
