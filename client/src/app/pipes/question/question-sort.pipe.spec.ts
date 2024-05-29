/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Question } from '@common/question';
import { QuestionSortPipe } from './question-sort.pipe';

describe('QuestionSortPipe', () => {
    it('create an instance', () => {
        const pipe = new QuestionSortPipe();
        expect(pipe).toBeTruthy();
    });

    it('should sort questions by date', () => {
        const first = { lastModif: new Date(2000).toString() };
        const second = { lastModif: new Date(1999).toString() };
        const questions: Question[] = [first, second] as unknown as Question[];
        expect(new QuestionSortPipe().transform(questions)).toEqual([second, first] as unknown as Question[]);
    });
});
