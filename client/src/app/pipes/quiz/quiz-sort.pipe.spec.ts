import { Quiz } from '@common/quiz';
import { QuizSortPipe } from './quiz-sort.pipe';

/* eslint-disable @typescript-eslint/no-magic-numbers */

describe('QuizSortPipe', () => {
    it('create an instance', () => {
        const pipe = new QuizSortPipe();
        expect(pipe).toBeTruthy();
    });

    it('should sort quizzes by date', () => {
        const first = { lastModification: new Date(2000).toString() };
        const second = { lastModification: new Date(1999).toString() };
        const quizzes: Quiz[] = [first, second] as unknown as Quiz[];
        expect(new QuizSortPipe().transform(quizzes)).toEqual([second, first] as unknown as Quiz[]);
    });
});
