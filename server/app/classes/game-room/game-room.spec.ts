/* eslint-disable max-lines */
import { Factory, gameStateTable } from '@app/classes/game-states/factory/factory';
import { GameState } from '@app/classes/game/game';
import { InfosPlayer, Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { Timer } from '@app/classes/timer/timer';
import { VoteList } from '@app/classes/vote-list/vote-list';
import { playerMock, quiz, spyOnPrivate, startDateTime } from '@app/utils/game-room-test-helpers';
import { socketMock } from '@app/utils/socket-mock';
import { BarChartEvent, GradeCategory, Interaction, Leaderboard, LeaderboardEntry, PlayerState, SelectedChoice } from '@common/events';
import { LAQ_DURATION, SECOND } from '@common/constants';
import { History } from '@common/history';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { SinonStubbedInstance, createStubInstance, match } from 'sinon';
import { Socket } from 'socket.io';
import { GameRoom } from './game-room';

/* eslint-disable @typescript-eslint/no-magic-numbers */

describe('GameRoom', () => {
    jest.useFakeTimers();
    let room: SinonStubbedInstance<Room<Player>>;
    let gameroom: GameRoom;
    const factory = new Factory(gameStateTable);

    beforeEach(() => {
        room = createStubInstance<Room<Player>>(Room);
        gameroom = new GameRoom(quiz, room, factory);
        jest.setSystemTime(startDateTime);
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it('should identify players by name', () => {
        const p = playerMock('bla');
        room.getMembers.returns([p]);
        expect(gameroom.getPlayerByName('foo')).toBeUndefined();
        expect(gameroom.getPlayerByName(p.username)).toBe(p);
    });

    describe('leavers', () => {
        let p1: Player;
        let p2: Player;

        beforeEach(() => {
            const s1 = socketMock('1');
            const s2 = socketMock('2');
            p1 = new Player(s1, s1.id);
            p2 = new Player(s2, s2.id);
            room.getMembers.returns([p1, p2]);
            room.leave.callsFake((s) => {
                room.getMembers.returns(room.getMembers().filter((p) => p.getSocket() !== s));
            });
        });

        it('should notify organiser if left during game', () => {
            gameroom.game.state = GameState.Answering;
            room.getMember.returns(p1);
            gameroom.leave(p1.getSocket());
            expect(gameroom['leavers']).toHaveLength(1);
            expect(room.leave.calledOnceWith(p1.getSocket())).toBeTruthy();
            expect(
                room.toOrganiser.calledOnceWith(Leaderboard.send, [
                    { username: p2.username, nBonus: p2.numberOfBonuses, points: p2.score, state: PlayerState.NoAction, isMuted: false },
                    { username: p1.username, nBonus: p1.numberOfBonuses, points: p1.score, state: PlayerState.Left, isMuted: false },
                ]),
            ).toBeTruthy();
        });

        it('should just leave if game is not started yet', () => {
            gameroom.game.state = GameState.Joining;
            gameroom.leave(p1.getSocket());
            expect(gameroom['leavers']).toHaveLength(0);
            expect(room.toOrganiser.notCalled).toBeTruthy();
            expect(room.leave.calledOnceWith(p1.getSocket())).toBeTruthy();
            expect(gameroom.getLeaderboard()).toEqual([
                { username: p2.username, nBonus: p2.numberOfBonuses, points: p2.score, state: PlayerState.NoAction, isMuted: false },
            ]);
        });

        [GameState.ShowingAnswers, GameState.Over].forEach((s) => {
            it(`should not abandon if the final leaderboard was set (by showing answers state) [${s}]`, () => {
                gameroom.game.state = s;
                const finalLeaderboard = [
                    { username: p1.username, nBonus: p1.numberOfBonuses, points: p1.score, state: PlayerState.NoAction, isMuted: false },
                    { username: p2.username, nBonus: p2.numberOfBonuses, points: p2.score, state: PlayerState.NoAction, isMuted: false },
                ];
                gameroom['finalLeaderboard'] = finalLeaderboard;

                gameroom.leave(p1.getSocket());

                expect(gameroom['leavers']).toHaveLength(0);
                expect(room.toOrganiser.notCalled).toBeTruthy();
                expect(room.leave.calledOnceWith(p1.getSocket())).toBeTruthy();
                expect(gameroom.getLeaderboard()).toEqual(finalLeaderboard);
            });
        });
    });

    describe('vote lists', () => {
        describe('select choice', () => {
            it('should select and notify the organiser of the change', () => {
                const p = playerMock('p');
                room.getMember.returns(p);
                room.getMembers.returns([p]);

                gameroom.selectChoice(p.getSocket(), { index: 0, questionIndex: 0, isSelected: true });

                expect(p.state).toBe(PlayerState.Interacted);
                expect(p.selected).toEqual([0]);
                expect(room.toOrganiser.calledOnceWith(Leaderboard.send)).toBeTruthy();

                gameroom.selectChoice(p.getSocket(), { index: 1, questionIndex: 0, isSelected: true });
                expect(p.selected).toEqual([0, 1]);
                gameroom.selectChoice(p.getSocket(), { index: 0, questionIndex: 0, isSelected: false });
                expect(p.selected).toEqual([1]);
            });

            it('should do nothing if socket is not recognized', () => {
                room.getMember.returns(undefined);
                expect(() => gameroom.selectChoice(socketMock(''), {} as SelectedChoice)).not.toThrow();
            });

            it("should do nothing if it's for another question", () => {
                const p = playerMock('p');
                room.getMember.returns(p);
                room.getMembers.returns([p]);
                gameroom.game['questionIndex'] = 2;
                gameroom.selectChoice(p.getSocket(), { index: 0, questionIndex: 1, isSelected: true });

                expect(p.state).toBe(PlayerState.NoAction);
                expect(room.toOrganiser.notCalled).toBeTruthy();
            });
        });
    });

    describe('start round', () => {
        it('should reset', () => {
            const p = playerMock('p');
            room.getMembers.returns([p]);

            gameroom.game.isReadyForNextQuestion = true;
            gameroom.game.timer.startCountdown(0);
            p.infos = {} as InfosPlayer;
            p.state = PlayerState.Submitted;
            p.selected = [1, 2, 3];

            gameroom.startRound();

            expect(gameroom.readyForNextQuestion()).toBe(false);
            expect(gameroom.game.timer.remaining()).toBe(quiz.duration * SECOND);
            expect(p.infos).toBeNull();
            expect(p.state).toBe(PlayerState.NoAction);
            expect(p.selected).toEqual([]);
        });

        it('should start countdown with LAQ_DURATION when current question is LAQ', () => {
            room.getMembers.returns([]);
            gameroom.game.getCurrentQuestion = () => ({ type: QTypes.LAQ }) as Question;
            gameroom.startRound();
            expect(gameroom.game.timer.remaining()).toBe(LAQ_DURATION);
        });
    });

    describe('verify MCQ', () => {
        it('should update submitted votes and notify organiser', () => {
            const p1 = playerMock('p1');
            const p2 = playerMock('p2');
            room.getMembers.returns([p1, p2]);
            gameroom.game.state = GameState.Answering;

            room.getMember.returns(p1);
            gameroom.verifyMCQ(p1.getSocket(), [0]);

            expect(p1.infos.answers).toEqual([0]);
            expect(p1.selected).toEqual([0]);
            expect(p1.state).toBe(PlayerState.Submitted);

            expect(
                room.toOrganiser.calledWith(Leaderboard.send, [
                    { username: p1.username, nBonus: 0, points: 0, state: PlayerState.Submitted, isMuted: false },
                    { username: p2.username, nBonus: 0, points: 0, state: PlayerState.NoAction, isMuted: false },
                ]),
            ).toBeTruthy();
            expect(room.toOrganiser.calledWith(BarChartEvent.SendSubmitList, { howManySubmitted: 1 })).toBeTruthy();
        });
    });

    describe('game results', () => {
        it('should give all game questions and submitted votes', () => {
            const questions = [
                { text: 'a', points: 1, choices: [], type: QTypes.MCQ },
                { text: 'b', points: 2, choices: [{ text: 'bla', isCorrect: false }], type: QTypes.MCQ },
            ] as Question[];

            gameroom.pushSubmittedVotes(new VoteList(questions[0]));

            const votes = new VoteList(questions[1]);
            votes.toggle({ index: 0, isSelected: true } as SelectedChoice);
            gameroom.pushSubmittedVotes(votes);

            gameroom.game.quiz.questions = questions;
            expect(gameroom.getGameResults()).toEqual({
                question: [
                    { index: 0, text: 'a', points: 1, choices: [], type: QTypes.MCQ },
                    { index: 1, text: 'b', points: 2, choices: ['bla'], type: QTypes.MCQ },
                ],
                votes: [[], [{ name: 'bla', votes: 1, isCorrect: false }]],
                gradeCounts: [
                    {
                        [GradeCategory.Zero]: 0,
                        [GradeCategory.Fifty]: 0,
                        [GradeCategory.Hundred]: 0,
                    },
                    {
                        [GradeCategory.Zero]: 0,
                        [GradeCategory.Fifty]: 0,
                        [GradeCategory.Hundred]: 0,
                    },
                ],
            });
        });
    });

    describe('laq grade', () => {
        let p1: Player;

        beforeEach(() => {
            const s1 = socketMock('1');
            p1 = new Player(s1, s1.id);
            room.getMembers.returns([p1]);
        });

        it('should return the grade of the player', () => {
            const p1Grade = 100;
            gameroom['gradeManager']['grades'] = [{ username: p1.getSocket().id, grade: 100 }];
            expect(gameroom.getGrade(p1)).toEqual(p1Grade);
        });

        it('should return undefined if the player doesnt have a grade', () => {
            gameroom['gradeManager']['grades'] = [];
            expect(gameroom.getGrade(p1)).toEqual(undefined);
        });

        it('should go to laq results and update the grades from the organiser when grade 0', () => {
            gameroom['gradeManager']['grades'] = [];
            const socket = socketMock('bob');
            const gradesFromOrganiser = [{ username: 'bob', grade: 50 }];
            gameroom.goToLAQResults(socket, gradesFromOrganiser);
            expect(gameroom['gradeManager']['grades']).toEqual(gradesFromOrganiser);
            expect(gameroom.isGraded()).toBe(true);
        });

        it('should call getGradeCounts from gradeManager', () => {
            const getGradeCountsSpy = jest.spyOn(gameroom['gradeManager'], 'getGradeCounts');
            gameroom.getGradeCounts();
            expect(getGradeCountsSpy).toHaveBeenCalled();
        });
    });

    describe('interactions', () => {
        it('should update interaction for a player', () => {
            const p = playerMock('bob');
            p.getScore = () => ({ isMuted: true }) as LeaderboardEntry;
            jest.spyOn(p, 'interactLaq');
            room.getMembers.returns([p]);
            room.getMember.returns(p);

            gameroom.updateInteraction(p.getSocket(), { isChanged: true } as Interaction);

            expect(p.interactLaq).toHaveBeenCalledWith({ isChanged: true });
            expect(room.toOrganiser.calledWith(BarChartEvent.SendInteracted, { interacted: 1, notInteracted: 0 })).toBeTruthy();
            expect(room.toOrganiser.calledWith(Leaderboard.send, [p.getScore()])).toBeTruthy();
        });

        it('should return the interactions', () => {
            const players = [{ hasInteracted: true }, { hasInteracted: true }, { hasInteracted: false }];
            gameroom['getPlayers'] = jest.fn().mockReturnValue(players);
            expect(gameroom['getInteractions']()).toEqual({ interacted: 2, notInteracted: 1 });
        });

        it('should not fail if no player is found', () => {
            expect(() => gameroom.updateInteraction(socketMock(''), {} as Interaction)).not.toThrow();
        });
    });

    describe('timer', () => {
        let timer: SinonStubbedInstance<Timer>;

        beforeEach(() => {
            gameroom.game.timer = timer = createStubInstance(Timer);
        });

        it('should allow toggling the timer pause', () => {
            [false, true].forEach((v) => {
                timer.togglePause.returns(v);
                expect(gameroom.pauseTimer()).toBe(v);
                expect(timer.togglePause.calledOnce).toBeTruthy();
                timer.togglePause.resetHistory();
            });
        });

        it('should allow panicking', () => {
            gameroom.panicTimer();
            expect(timer.panic.calledOnce).toBeTruthy();
        });

        it('should properly launchCountdown', () => {
            const dt = 10;
            gameroom.launchCountdown(dt);
            expect(timer.stopPanicking.calledOnce).toBeTruthy();
            expect(timer.startCountdown.calledOnceWith(dt)).toBeTruthy();
            expect(timer.onTick.calledOnceWith(match.func)).toBeTruthy();
        });
    });

    describe('start time', () => {
        let canStartSpy: jest.SpyInstance;
        let organiser: SinonStubbedInstance<Socket>;
        const date = new Date(2000, 0, 1, 13, 0, 0);

        beforeEach(() => {
            organiser = socketMock('a');
            canStartSpy = spyOnPrivate(gameroom, 'canStart');
            jest.setSystemTime(date);
        });

        it('should have startTime defined', () => {
            canStartSpy.mockReturnValue(true);
            gameroom.startGame(organiser);
            expect(gameroom['startTime']).toBe(date.toISOString());
        });
    });

    describe('on gameOver', () => {
        it('should call subject function', () => {
            const testFct = jest.fn();
            gameroom.onGameOver().subscribe(testFct);
            gameroom.emitGameOver({} as unknown as History);
            expect(testFct).toHaveBeenCalledTimes(1);
        });
    });
});
