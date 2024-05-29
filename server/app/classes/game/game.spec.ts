import { Quiz } from '@common/quiz';
import { Game } from './game';

describe('Game', () => {
    it('should be defined', () => {
        expect(new Game({} as unknown as Quiz)).toBeDefined();
    });

    it('should provide the number of questions', () => {
        expect(new Game({ questions: [] } as unknown as Quiz).nQuestions()).toBe(0);
        expect(new Game({ questions: [{}, {}] } as unknown as Quiz).nQuestions()).toBe(2);
    });
});
