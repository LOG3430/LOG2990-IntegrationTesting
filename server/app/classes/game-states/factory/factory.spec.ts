import { GameRoom } from '@app/classes/game-room/game-room';
import { Factory, gameStateTable } from './factory';
import { GameState } from '@app/classes/game/game';

describe('Factory', () => {
    it('should be defined', () => {
        expect(new Factory(gameStateTable)).toBeDefined();
    });

    it('should give a valid state for every value', () => {
        const factory = new Factory(gameStateTable);
        Object.values(GameState).forEach((s) => {
            const constructor = factory.getState(s);
            expect(new constructor({} as GameRoom)).toBeTruthy();
        });
    });
});
