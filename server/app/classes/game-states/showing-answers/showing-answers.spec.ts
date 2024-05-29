import { GameRoom } from '@app/classes/game-room/game-room';
import { GameState } from '@app/classes/game/game';
import { InfosPlayer, Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { Verificator } from '@app/classes/verificator/verificator';
import { playerMock } from '@app/utils/game-room-test-helpers';
import { BarChartEvent, GameEvent, GradeCategory, GradeCount, PlayerState, QuestionResults } from '@common/events';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Socket } from 'socket.io';
import { ShowingAnswers } from './showing-answers';

describe('ShowingAnswers', () => {
    let state: ShowingAnswers;
    let game: SinonStubbedInstance<GameRoom>;
    let room: SinonStubbedInstance<Room<Player>>;

    beforeEach(() => {
        game = createStubInstance(GameRoom);
        room = createStubInstance(Room);
        game.room = room;
        state = new ShowingAnswers(game);
    });

    it('should be defined', () => {
        expect(state).toBeDefined();
    });

    describe('on init', () => {
        beforeEach(() => {
            game.getPlayers.returns([]);
        });

        it('should send mcq question results to players', () => {
            const p1 = playerMock('a');
            const p2 = playerMock('b');
            const players = [p1, p2];
            p1.infos = { answers: [] } as InfosPlayer;
            p2.infos = { answers: [1] } as InfosPlayer;

            game.getPlayers.returns(players);

            const p1Res = { points: 0 } as QuestionResults;
            const p2Res = { points: 1 } as QuestionResults;
            jest.spyOn(Verificator, 'verifyMCQ').mockImplementation((q, answers) => ({ points: answers.length }) as QuestionResults);
            p1.state = PlayerState.Submitted;
            p2.state = PlayerState.Interacted;
            state.onInit();

            expect(game.isFirstToAnswer.calledWith(p1));
            expect(game.isFirstToAnswer.calledWith(p2));

            expect((p1.getSocket() as SinonStubbedInstance<Socket>).emit.calledOnceWith(GameEvent.QuestionResults, p1Res)).toBeTruthy();
            expect((p2.getSocket() as SinonStubbedInstance<Socket>).emit.calledOnceWith(GameEvent.QuestionResults, p2Res)).toBeTruthy();
        });

        it('should send laq question results to players', () => {
            const p3 = playerMock('c');
            const players = [p3];
            p3.infos = { answers: 'oui' } as InfosPlayer;

            game.getPlayers.returns(players);

            game['grades'] = [{ username: 'c', grade: 0 }];
            jest.spyOn(Verificator, 'verifyLAQ').mockImplementation(() => ({ points: game.getGrade(p3) }) as QuestionResults);
            p3.state = PlayerState.Submitted;
            state.onInit();
        });

        it('should go to next question and launch interval', () => {
            state.onInit();
            expect(game.goToNextQuestion.calledOnce).toBeTruthy();
            expect(game.tick.calledOnce).toBeTruthy();
        });

        it('should not set the final leaderboard if there are more questions', () => {
            game.hasNextQuestion.returns(true);
            state.onInit();
            expect(game.setFinalLeaderboard.notCalled).toBeTruthy();
        });

        it('should set the final leaderboard if there is no more questions', () => {
            game.hasNextQuestion.returns(false);
            state.onInit();
            expect(game.setFinalLeaderboard.calledOnce).toBeTruthy();
        });

        it('should send grade counts to organiser', () => {
            const grades = { [GradeCategory.Zero]: 0 } as GradeCount;
            game.pushSubmittedVotes.callsFake(() => game.getGradeCounts.returns(grades));
            state.onInit();
            expect(room.toOrganiser.calledWith(BarChartEvent.SendGrades, grades)).toBeTruthy();
        });

        it('should send showing answer event', () => {
            state.onInit();
            expect(room.toAll.calledWith(GameEvent.IsShowingAnswers)).toBeTruthy();
        });

        it('should clear interval to stop the game timer before going to next question', () => {
            game.clearInterval.callsFake(() => expect(game.goToNextQuestion.called).toBeFalsy());
            state.onInit();
            expect(game.clearInterval.calledOnce).toBeTruthy();
        });
    });

    describe('states', () => {
        it('should stay in this state if not ready for next question', () => {
            game.readyForNextQuestion.returns(false);
            expect(state.nextState()).toBe(GameState.ShowingAnswers);
        });

        it('should go to answering if ready for next question and has next question', () => {
            game.readyForNextQuestion.returns(true);
            game.hasNextQuestion.returns(true);
            expect(state.nextState()).toBe(GameState.Answering);
        });

        it('should go to game over if ready for next question and no next question', () => {
            game.readyForNextQuestion.returns(true);
            game.hasNextQuestion.returns(false);
            expect(state.nextState()).toBe(GameState.Over);
        });
    });
});
