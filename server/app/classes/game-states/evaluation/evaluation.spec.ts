import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Evaluation } from './evaluation';
import { GameRoom } from '@app/classes/game-room/game-room';
import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { GameEvent, UserAnswer } from '@common/events';
import { playerMock } from '@app/utils/game-room-test-helpers';
import { GameState } from '@app/classes/game/game';

describe('Evaluation', () => {
    let state: Evaluation;
    let game: SinonStubbedInstance<GameRoom>;
    let room: SinonStubbedInstance<Room<Player>>;

    beforeEach(() => {
        room = createStubInstance(Room);
        game = createStubInstance(GameRoom);
        game.room = room;
        state = new Evaluation(game);
    });

    it('should be defined', () => {
        expect(state).toBeDefined();
    });

    it('should notify organiser and members on init and stop updating game room', () => {
        const p = playerMock('p');
        p.getLaqAnswer = () => ({ answers: 'bla' }) as UserAnswer;
        game.getPlayers.returns([p]);
        state.onInit();
        expect(game.clearInterval.calledOnce).toBeTruthy();
        expect(room.toOrganiser.calledOnceWith(GameEvent.Evaluating, [p.getLaqAnswer()])).toBeTruthy();
        expect(room.toMembers.calledOnceWith(GameEvent.QuestionEvaluation)).toBeTruthy();
    });

    describe('states', () => {
        it('should stay in this state while not graded', () => {
            game.isGraded.returns(false);
            expect(state.nextState()).toBe(GameState.Evaluation);
        });

        it('should go to showing answers once graded', () => {
            game.isGraded.returns(true);
            expect(state.nextState()).toBe(GameState.ShowingAnswers);
        });
    });
});
