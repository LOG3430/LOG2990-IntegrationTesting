import { Answering } from './answering';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { GameRoom } from '@app/classes/game-room/game-room';
import { GameState } from '@app/classes/game/game';
import { Room } from '@app/classes/room/room';
import { Player } from '@app/classes/player/player';
import { BarChartEvent, GameEvent, GameQuestion, Leaderboard, LeaderboardEntry } from '@common/events';
import { VoteList } from '@app/classes/vote-list/vote-list';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';

describe('Answering', () => {
    let state: Answering;
    let game: SinonStubbedInstance<GameRoom>;
    let room: SinonStubbedInstance<Room<Player>>;

    beforeEach(() => {
        room = createStubInstance(Room<Player>);
        game = createStubInstance(GameRoom);
        game.room = room;
        state = new Answering(game);
    });

    it('should be defined', () => {
        expect(state).toBeDefined();
    });

    it('should setup when arriving in this state', () => {
        game.getGameQuestion.returns({ text: '?' } as GameQuestion);

        const leaderboard = [{ username: 'foo' }] as LeaderboardEntry[];
        game.startRound.callsFake(() => game.getLeaderboard.returns(leaderboard));

        const votelist = new VoteList({ choices: [] } as Question);
        game.getSelectedVotes.returns(votelist);

        state.onInit();

        expect(room.toAll.calledWith(GameEvent.NewQuestion, game.getGameQuestion())).toBeTruthy();
        expect(room.toAll.calledWith(GameEvent.IsAnswering)).toBeTruthy();

        expect(room.toOrganiser.calledWith(Leaderboard.send, leaderboard)).toBeTruthy();
        expect(room.toOrganiser.calledWith(BarChartEvent.SendSelectedList, votelist.getVotes())).toBeTruthy();

        expect(room.setTerminateWhenNoPlayers.called).toBeTruthy();
        expect(game.startRound.called).toBeTruthy();
        expect(game.tick.called).toBeTruthy();
    });

    describe('next state', () => {
        describe('when all players answered', () => {
            beforeEach(() => {
                game.allPlayersAnswered.returns(true);
            });

            it('should go to showing answers if is MCQ', () => {
                game.getCurrentQuestion.returns({ type: QTypes.MCQ } as Question);
                expect(state.nextState()).toBe(GameState.ShowingAnswers);
            });

            it('should go to evaluation if is LAQ', () => {
                game.getCurrentQuestion.returns({ type: QTypes.LAQ } as Question);
                expect(state.nextState()).toBe(GameState.Evaluation);
            });
        });

        describe('when not all players answered', () => {
            beforeEach(() => {
                game.allPlayersAnswered.returns(false);
            });

            it('should go to timed out if timer is done', () => {
                game.isTimerDone.returns(true);
                expect(state.nextState()).toBe(GameState.TimedOut);
            });

            it('should stay in state if timer is not done', () => {
                game.isTimerDone.returns(false);
                expect(state.nextState()).toBe(GameState.Answering);
            });
        });
    });
});
