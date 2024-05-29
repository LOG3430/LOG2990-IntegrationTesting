import { TestBed } from '@angular/core/testing';
import { Factory } from '@app/classes/factory/factory';
import { AdminService } from '@app/services/admin/admin.service';
import { QuizValidatorService } from '@app/services/quiz-validator/quiz-validator.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { Quiz } from '@common/quiz';
import { of } from 'rxjs';

import { QuizCreatorService } from './quiz-creator.service';

describe('QuizCreatorService', () => {
    let service: QuizCreatorService;
    let quizService: jasmine.SpyObj<QuizService>;
    let quizValidator: jasmine.SpyObj<QuizValidatorService>;
    let admin: jasmine.SpyObj<AdminService>;

    const quiz: Quiz = {
        id: 'quiz',
        title: 'tux',
        description: 'blabla',
        duration: 10,
        questions: [],
    } as unknown as Quiz;

    beforeEach(() => {
        quizService = jasmine.createSpyObj('QuizService', ['getQuiz']);
        quizValidator = jasmine.createSpyObj('QuizValidatorService', [
            'isValid',
            'isValidTitle',
            'isValidDescription',
            'isValidQuestion',
            'isValidDuration',
        ]);
        admin = jasmine.createSpyObj('AdminService', ['updateQuiz', 'submitNewQuiz']);

        TestBed.configureTestingModule({
            providers: [
                { provide: QuizService, useValue: quizService },
                { provide: QuizValidatorService, useValue: quizValidator },
                { provide: AdminService, useValue: admin },
            ],
        });
        service = TestBed.inject(QuizCreatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('import quiz from file', () => {
        let reader: jasmine.SpyObj<FileReader>;

        beforeEach(() => {
            reader = jasmine.createSpyObj('FileReader', ['readAsText']);
            spyOn(window, 'FileReader').and.returnValue(reader);

            service.init(null).subscribe();
        });

        const setupFileReader = <T>(event: T) => {
            const blob = {} as Blob;

            reader.readAsText.and.callFake((f) => {
                expect(f).toBe(blob);
                expect(reader.onload).toBeTruthy();
                if (reader.onload) {
                    reader.onload(event as ProgressEvent<FileReader>);
                }
            });

            return blob;
        };

        it('should be able to import a quiz from a file', async () => {
            const blob = setupFileReader({
                target: {
                    result: JSON.stringify(quiz),
                },
            });

            quizValidator.isValidTitle.and.returnValue(true);
            quizValidator.isValidDescription.and.returnValue(true);
            quizValidator.isValidDuration.and.returnValue(true);
            quizValidator.isValidQuestion.and.returnValue(true);

            expect(await service.importQuizFile(blob)).toBeTrue();
            expect(reader.readAsText).toHaveBeenCalled();

            expect(service.quiz.title).toEqual(quiz.title);
            expect(service.quiz.description).toEqual(quiz.description);
            expect(service.quiz.duration).toEqual(quiz.duration);
            expect(service.quiz.questions).toEqual(quiz.questions);
        });

        it('should keep its data if not defined when importing a quiz from a file', async () => {
            const blob = setupFileReader({
                target: {
                    result: JSON.stringify({ foo: 'bar' }),
                },
            });

            expect(await service.importQuizFile(blob)).toBeTrue();
            expect(reader.readAsText).toHaveBeenCalled();

            expect(service.quiz.title).toEqual(service.quiz.title);
            expect(service.quiz.description).toEqual(service.quiz.description);
            expect(service.quiz.duration).toEqual(service.quiz.duration);
            expect(service.quiz.questions).toEqual(service.quiz.questions);
            expect(Object.keys(service.quiz)).not.toContain('foo');
        });

        it('should do nothing if event has no content', async () => {
            const events = [
                {
                    target: {
                        result: '',
                    },
                },
                {
                    target: {},
                },
                {},
            ];

            events.forEach(async (e) => {
                const blob = setupFileReader(e);

                expect(await service.importQuizFile(blob)).toBeFalse();
                expect(reader.readAsText).toHaveBeenCalled();
            });
        });
    });

    describe('when creating', () => {
        beforeEach(() => {
            service.init(null).subscribe();
        });

        it('should init a blank quiz and not be in modifying state', () => {
            expect(service.quiz).toEqual(Factory.makeQuiz());
            expect(service.isModified()).toBeFalse();
        });

        it('should submit a valid quiz', () => {
            quizValidator.isValid.and.returnValue(true);
            admin.submitNewQuiz.and.callFake(() => of(true));

            service.submit().subscribe((res) => expect(res).toBeTrue());
            expect(admin.submitNewQuiz).toHaveBeenCalledWith(service.quiz);
        });

        it('should not submit an invalid quiz', () => {
            quizValidator.isValid.and.returnValue(false);

            service.submit().subscribe((res) => expect(res).toBeFalse());
            expect(admin.submitNewQuiz).not.toHaveBeenCalled();
        });
    });

    describe('when modifying', () => {
        beforeEach(() => {
            quizService.getQuiz.and.returnValue(of(quiz));
            service.init(quiz.id).subscribe();
        });

        it('should fetch the quiz and be in modifying state', () => {
            expect(quizService.getQuiz).toHaveBeenCalledWith(quiz.id);
            expect(service.quiz).toBe(quiz);
            expect(service.isModified()).toBeTrue();
        });

        it('should submit a valid quiz', () => {
            quizValidator.isValid.and.returnValue(true);
            admin.updateQuiz.and.callFake(() => of(true));

            service.submit().subscribe((res) => expect(res).toBeTrue());
            expect(admin.updateQuiz).toHaveBeenCalledWith(service.quiz);
        });

        it('should not submit an invalid quiz', () => {
            quizValidator.isValid.and.returnValue(false);

            service.submit().subscribe((res) => expect(res).toBeFalse());
            expect(admin.updateQuiz).not.toHaveBeenCalled();
        });
    });
});
