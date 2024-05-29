import { TestBed } from '@angular/core/testing';
import { Choice } from '@common/choice';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { Quiz } from '@common/quiz';
import { QuizValidatorService } from './quiz-validator.service';

describe('QuizValidatorService', () => {
    let service: QuizValidatorService;

    const q1: Question = {
        id: '0',
        lastModif: '',
        type: QTypes.MCQ,
        text: 'test',
        points: 30,
        choices: [
            { isCorrect: true, text: 'choice1' },
            { isCorrect: false, text: 'choice2' },
        ] as Choice[],
    };

    const testQuiz: Quiz = {
        title: 'Test Quiz 1',
        description: 'Description test 1',
        id: '',
        duration: 10,
        lastModification: '',
        questions: [q1],
        visibility: false,
    };

    const wrongQuiz: Quiz = {
        title: '',
        description: '',
        id: '',
        duration: 11,
        lastModification: '',
        questions: [],
        visibility: false,
    };

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(QuizValidatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return true if duration respects rules', () => {
        expect(service.isValidDuration(testQuiz.duration)).toBeTruthy();
    });

    it('should return false if duration does not respects rules', () => {
        expect(service.isValidDuration(wrongQuiz.duration)).toBeFalsy();
    });

    it('should return false if there are empty title ', () => {
        expect(service.isValidTitle(wrongQuiz.title)).toBeFalse();
    });

    it('should return true if there are not empty title ', () => {
        expect(service.isValidTitle(testQuiz.title)).toBeTrue();
    });

    it('should return false if there are empty description ', () => {
        expect(service.isValidDescription(wrongQuiz.description)).toBeFalse();
    });

    it('should return true if there are not empty description ', () => {
        expect(service.isValidDescription(testQuiz.description)).toBeTrue();
    });

    it('should return true if the update quiz respect non-empty', () => {
        expect(service.isValid(testQuiz)).toBeTrue();
    });

    it('should return true if the update quiz does not respect non-empty', () => {
        expect(service.isValid(wrongQuiz)).toBeFalse();
    });

    it('should return true if all questions are valid', () => {
        expect(service.areValidQuestions(testQuiz.questions)).toBeTruthy();
    });

    it('should return false if a question is not valid', () => {
        expect(service.areValidQuestions(wrongQuiz.questions)).toBeFalsy();
    });
});
