import { TestBed } from '@angular/core/testing';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { QuestionValidatorService } from './question-validator.service';

describe('QuestionValidatorService', () => {
    let service: QuestionValidatorService;

    const questionTest: Question = {
        id: '0',
        lastModif: '',
        type: QTypes.MCQ,
        text: 'Q0',
        points: 30,
        choices: [
            { text: 'Correct choice', isCorrect: true },
            { text: 'Wrong choice', isCorrect: false },
        ],
    };

    const questionWrong: Question = {
        id: '0',
        lastModif: '',
        type: QTypes.MCQ,
        text: '',
        points: 20,
        choices: [{ text: '', isCorrect: false }],
    };

    const allGoodQuestion: Question = {
        id: '0',
        lastModif: '',
        type: QTypes.MCQ,
        text: '',
        points: 20,
        choices: [
            { text: 'First correct choice', isCorrect: true },
            { text: 'Second correct choice', isCorrect: true },
        ],
    };

    const allWrongQuestion: Question = {
        id: '0',
        lastModif: '',
        type: QTypes.MCQ,
        text: '',
        points: 20,
        choices: [
            { text: 'First wrong choice', isCorrect: false },
            { text: 'Second wrong choice', isCorrect: false },
        ],
    };

    const undefinedChoices: Question = {
        id: '0',
        lastModif: '',
        type: QTypes.MCQ,
        text: '',
        points: 20,
        choices: undefined,
    };

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(QuestionValidatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return true if there is at least one correct choice', () => {
        expect(service.hasGood(questionTest)).toBe(true);
    });

    it('should return false if there not any correct choice', () => {
        expect(service.hasGood(questionWrong)).toBeFalse();
    });

    it('should return true if all choices are correct', () => {
        expect(service.hasGood(allGoodQuestion)).toBe(true);
    });

    it('should return false if all choices are wrong', () => {
        expect(service.hasGood(allWrongQuestion)).toBeFalse();
    });

    it('should return false if choices are undefined', () => {
        expect(service.hasGood(undefinedChoices)).toBeFalse();
    });

    it('should return true if all choices are wrong', () => {
        expect(service.hasWrong(allWrongQuestion)).toBe(true);
    });

    it('should return false if all choices are wrong', () => {
        expect(service.hasWrong(allGoodQuestion)).toBeFalse();
    });

    it('should return false if choices are undefined', () => {
        expect(service.hasWrong(undefinedChoices)).toBeFalse();
    });

    it('should return true if all choices have non-empty text', () => {
        expect(service.noWhitespaceChoice(questionTest)).toBeTrue();
    });

    it('should return false if there are choices with empty text', () => {
        expect(service.noWhitespaceChoice(questionWrong)).toBeFalse();
    });

    it('should return false if choices are undefined', () => {
        expect(service.noWhitespaceChoice(undefinedChoices)).toBeFalse();
    });

    it('should return true if the question text is non-empty', () => {
        expect(service.hasText(questionTest)).toBeTrue();
    });

    it('should return false if the question text is empty', () => {
        expect(service.hasText(questionWrong)).toBeFalse();
    });

    it('should return true to validate all the choices', () => {
        expect(service.areValidChoices(questionTest)).toBeTrue();
    });

    it('should return false since there is some test that does not pass', () => {
        expect(service.areValidChoices(questionWrong)).toBeFalse();
    });

    it('should return true to validate all the params of question', () => {
        expect(service.isValid(questionTest)).toBeTrue();
    });

    it('should return false to validate all the params of question', () => {
        expect(service.isValid(questionWrong)).toBeFalse();
    });

    it('should return true if the question is a LAQ', () => {
        const questionLAQ: Question = {
            id: '0',
            lastModif: '',
            type: QTypes.LAQ,
            text: 'Q0',
            points: 30,
            choices: undefined,
        };
        expect(service.isValid(questionLAQ)).toBeTrue();
        expect(service.isChoicesAvailable(questionLAQ)).toBeTrue();
    });

    it('should return false if the question is not valid', () => {
        const question = { foo: 1 } as unknown as Question;
        expect(service.isValid(question)).toBeFalse();
    });

    it('should define choices if its undefinde or null', () => {
        const questionUndefined = { foo: 1 } as unknown as Question;
        expect(service.areValidChoices(questionUndefined)).toBeFalse();
    });
});
