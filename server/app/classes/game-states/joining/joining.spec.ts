import { Joining } from './joining';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { GameRoom } from '@app/classes/game-room/game-room';
import { GameState } from '@app/classes/game/game';

describe('Joining', () => {
    let state: Joining;
    let game: SinonStubbedInstance<GameRoom>;

    beforeEach(() => {
        game = createStubInstance(GameRoom);
        state = new Joining(game);
    });

    it('should be defined', () => {
        expect(state).toBeDefined();
    });

    it('should go to answering when received start', () => {
        game.receivedStart.returns(true);
        expect(state.nextState()).toBe(GameState.Answering);
    });

    it('should stay when not received start', () => {
        game.receivedStart.returns(false);
        expect(state.nextState()).toBe(GameState.Joining);
    });
});
