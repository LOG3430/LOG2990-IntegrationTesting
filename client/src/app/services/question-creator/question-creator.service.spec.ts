import { TestBed } from '@angular/core/testing';
import { QuestionValidatorService } from '@app/services/question-validation/question-validator.service';
import { Choice } from '@common/choice';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { QuestionCreatorService } from './question-creator.service';

describe('QuestionCreatorService', () => {
    let service: QuestionCreatorService;
    let questionValidatorSpy: jasmine.SpyObj<QuestionValidatorService>;
    const c1: Choice = { text: '', isCorrect: false };
    const c2: Choice = { text: '', isCorrect: false };
    const testChoices: Choice[] = [c1, c2];
    let emptyQuestion: Question;

    beforeEach(() => {
        questionValidatorSpy = jasmine.createSpyObj('QuestionValidatorService', ['isValid']);

        TestBed.configureTestingModule({
            providers: [{ provide: QuestionValidatorService, useValue: questionValidatorSpy }],
        });
        service = TestBed.inject(QuestionCreatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call init if the data is empty', () => {
        service.init(emptyQuestion);
        expect(service.getChoices()).toEqual(testChoices);
    });

    it('should return false if the choices of the question is undefined', () => {
        const question = { foo: 1 } as unknown as Question;
        service.init(question);
        expect(service.isValidChoice(0)).toBeFalse();
    });

    it('should return empty array if the choices is not defined', () => {
        const question = { foo: 1 } as unknown as Question;
        service.init(question);
        expect(service.getChoices()).toEqual([]);
    });

    describe('add or delete choices', () => {
        beforeEach(async () => {
            await service.init(emptyQuestion);
        });

        it('should add choices', () => {
            expect(service.addChoice()).toBeTruthy();
            expect(service.getChoices().length).toEqual(testChoices.length + 1);
        });

        it('should not add more choices', () => {
            const c3: Choice = { text: '', isCorrect: false };
            const c4: Choice = { text: '', isCorrect: true };
            service.getQuestion().choices = [c1, c2, c3, c4];
            expect(service.addChoice()).toBeFalsy();
        });

        it('should delete choices ', () => {
            const c3: Choice = { text: '', isCorrect: false };
            service.getQuestion().choices = [c1, c2, c3];
            service.deleteChoice(1);
            expect(service.getQuestion().choices).toEqual([c2, c3]);
        });
    });

    describe('should verify if the changes was made in the question', () => {
        beforeEach(async () => {
            await service.init(emptyQuestion);
        });

        it('should modify the points of the question', () => {
            const pointInt = 20;
            service.onSelected('20');
            expect(service.getQuestion().points).toEqual(pointInt);
        });

        it('should verify if the choice is valid', () => {
            const c3: Choice = { text: '', isCorrect: true };
            service.getQuestion().choices = [c1, c2, c3];
            expect(service.isValidChoice(2)).toBeTruthy();
        });

        it('should return false if the choice is not valid', () => {
            expect(service.isValidChoice(1)).toBeFalsy();
        });

        it('should toggle isCorrect property of a choice', () => {
            service.onClickValidity(1);
            expect(service.getChoices()[1].isCorrect).toBeTruthy();
            service.onClickValidity(1);
            expect(service.getChoices()[1].isCorrect).toBeFalsy();
        });

        it('should verify if the question is valid', () => {
            questionValidatorSpy.isValid.and.returnValue(true);
            expect(service.isValidQuestion(service.getQuestion())).toBeTruthy();
        });

        it('should should change the type of the question', () => {
            service.getQuestion().type = QTypes.MCQ;
            service.setTypeQuestion();
            expect(service.getQuestion().type).toEqual(QTypes.LAQ);
            expect(service.getChoices()).toEqual([]);
            service.setTypeQuestion();
            expect(service.getQuestion().type).toEqual(QTypes.MCQ);
            expect(service.getChoices()).toEqual(service.initEmptyChoices());
        });
    });
});
