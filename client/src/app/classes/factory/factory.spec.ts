import { Factory } from './factory';

describe('Factory', () => {
    it('should create an instance', () => {
        expect(new Factory()).toBeTruthy();
    });

    it('should be able to create a quiz', () => {
        expect(Factory.makeQuiz()).toBeTruthy();
    });
});
