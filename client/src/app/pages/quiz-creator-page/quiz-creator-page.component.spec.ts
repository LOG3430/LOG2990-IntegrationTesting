import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { DialogService } from '@app/services/dialog/dialog.service';
import { GlobalService } from '@app/services/global/global.service';
import { QuestionService } from '@app/services/question/question.service';
import { QuizCreatorService } from '@app/services/quiz-creator/quiz-creator.service';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { Quiz } from '@common/quiz';
import { of } from 'rxjs';
import { QuizCreatorPageComponent } from './quiz-creator-page.component';

@Component({ selector: 'app-question-panel' })
class QuestionPanelComponent {
    @Input() index: number;
    @Input() question: Question;
}

const mockEvent = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);

describe('QuizCreatorPageComponent', () => {
    let component: QuizCreatorPageComponent;
    let fixture: ComponentFixture<QuizCreatorPageComponent>;
    let questionSpy: jasmine.SpyObj<QuestionService>;
    let quizCreatorSpy: jasmine.SpyObj<QuizCreatorService>;

    let global: jasmine.SpyObj<GlobalService>;
    let router: jasmine.SpyObj<Router>;
    let route: ActivatedRoute;
    let dialog: jasmine.SpyObj<DialogService>;

    let q1: Question;
    let testQuiz: Quiz;
    const gameId = 'test';

    const init = (id: string | null) => {
        q1 = {
            id: '0',
            lastModif: '',
            type: QTypes.MCQ,
            text: '',
            points: 30,
            choices: [
                { text: 'choice 0', isCorrect: true },
                { text: 'choice 1', isCorrect: false },
            ],
        };

        testQuiz = {
            title: 'Test Quiz 1',
            description: 'Description test 1',
            id: '',
            duration: 10,
            lastModification: '',
            questions: [q1],
            visibility: false,
        };

        questionSpy = jasmine.createSpyObj('QuestionService', ['addQuestion']);
        quizCreatorSpy = jasmine.createSpyObj('QuizCreatorService', ['init', 'isModified', 'isValid', 'submit', 'importQuiz', 'importQuizFile']);

        quizCreatorSpy.init.and.callFake(() => {
            quizCreatorSpy.quiz = testQuiz;
            return of(undefined);
        });

        route = {
            snapshot: {
                paramMap: {
                    get: () => id,
                },
            },
        } as unknown as ActivatedRoute;

        dialog = jasmine.createSpyObj('DialogService', ['createQuestionDialog', 'pickQuestionsDialog', 'alert']);
        router = jasmine.createSpyObj('Router', ['navigate']);
        global = jasmine.createSpyObj('GlobalService', ['getRoute'], { dialog, router });
        global.getRoute.and.returnValue(route);

        TestBed.configureTestingModule({
            imports: [AppMaterialModule, NoopAnimationsModule, FormsModule, ReactiveFormsModule],
            declarations: [QuizCreatorPageComponent, QuestionPanelComponent, HeaderComponent],
            providers: [
                { provide: QuizCreatorService, useValue: quizCreatorSpy },
                { provide: QuestionService, useValue: questionSpy },
                { provide: GlobalService, useValue: global },
            ],
        });

        fixture = TestBed.createComponent(QuizCreatorPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    };

    describe('with id in url', () => {
        beforeEach(() => {
            init(gameId);
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should call questionCreator.isModified', () => {
            component.isModifying();
            expect(quizCreatorSpy.isModified).toHaveBeenCalled();
        });

        it('should call quiz creator service init with room id', () => {
            expect(quizCreatorSpy.init).toHaveBeenCalledOnceWith(gameId);
        });

        it('should update quiz title and validate quiz on key event', () => {
            const newTextUpdate = 'New Title of Quiz';
            const mockEventKeyboard: KeyboardEvent = {
                target: { value: newTextUpdate },
            } as unknown as KeyboardEvent;

            component.onKeyTitle(mockEventKeyboard);
            expect(quizCreatorSpy.quiz.title).toBe(newTextUpdate);
        });

        it('should update quiz description and validate quiz on key event', () => {
            const newTextUpdate = 'New Description of Quiz';
            const mockEventKeyboard: KeyboardEvent = {
                target: { value: newTextUpdate },
            } as unknown as KeyboardEvent;

            quizCreatorSpy.quiz = testQuiz;
            component.onKeyDescription(mockEventKeyboard);
            expect(quizCreatorSpy.quiz.description).toBe(newTextUpdate);
        });

        it('should change duration type from string to integer ', () => {
            const durationString = '10';
            const durationInt = 10;
            component.onSelected(durationString);
            expect(quizCreatorSpy.quiz.duration).toEqual(durationInt);
        });

        it('should open question dialog', () => {
            dialog.createQuestionDialog.and.returnValue(of(testQuiz.questions[0]));
            component.openQuestionDialog();
            expect(quizCreatorSpy.quiz.questions[0]).toEqual(testQuiz.questions[0]);
        });

        it('should return all the questions', () => {
            quizCreatorSpy.quiz = testQuiz;
            expect(quizCreatorSpy.quiz.questions).toEqual(component.getQuestions());
        });

        it('should remove question in my quiz', () => {
            quizCreatorSpy.quiz = testQuiz;
            component.removeQuestion(0);
            expect(quizCreatorSpy.quiz.questions.length).toBe(0);
        });

        it('should get choices of question when getChoice is called', () => {
            quizCreatorSpy.quiz = testQuiz;
            const choices = component.getChoices(0);
            expect(quizCreatorSpy.quiz.questions[0].choices).toEqual(choices);
        });

        it('should get [] of question when getChoice is called with empty choice array', () => {
            quizCreatorSpy.quiz.questions[0].choices = undefined;
            expect(component.getChoices(0)).toEqual([]);
        });

        it('should modify a question', () => {
            quizCreatorSpy.quiz = testQuiz;
            dialog.createQuestionDialog.and.returnValue(of(testQuiz.questions[0]));
            component.modifyQuestion(0, mockEvent);
            expect(mockEvent.stopPropagation).toHaveBeenCalled();
            expect(quizCreatorSpy.quiz.questions[0]).toEqual(testQuiz.questions[0]);
        });

        it('should pick question', () => {
            const q2 = {} as Question;
            const initialQuestionArray = [q1] as Question[];
            const newQuestionArray = [q2] as Question[];
            const updatedQuestionArray = [q1, q2];
            quizCreatorSpy.quiz.questions = initialQuestionArray;
            dialog.pickQuestionsDialog.and.returnValue(of(newQuestionArray));
            component.pickQuestions();
            expect(quizCreatorSpy.quiz.questions).toEqual(updatedQuestionArray);
        });

        it('should add question in DB', () => {
            quizCreatorSpy.quiz = testQuiz;
            questionSpy.addQuestion.and.returnValue(of(true));
            component.addQuestionToDb(0, mockEvent);
            expect(mockEvent.stopPropagation).toHaveBeenCalled();
            expect(quizCreatorSpy.quiz.questions[0]).toEqual(testQuiz.questions[0]);
        });

        it('should alert if question already exists in DB', () => {
            quizCreatorSpy.quiz = testQuiz;
            questionSpy.addQuestion.and.returnValue(of(false));

            component.addQuestionToDb(0, mockEvent);
            expect(mockEvent.stopPropagation).toHaveBeenCalled();
            expect(questionSpy.addQuestion).toHaveBeenCalledWith(quizCreatorSpy.quiz.questions[0]);
            expect(dialog.alert).toHaveBeenCalledWith('Question existe déjà dans la banque');
        });

        it('should not push anything if not valid question is sent', () => {
            quizCreatorSpy.quiz = testQuiz;
            dialog.createQuestionDialog.and.returnValue(of(undefined));
            component.openQuestionDialog();
            expect(quizCreatorSpy.quiz.questions.length).toEqual(1);
        });

        it('should navigate to /admin/quiz/catalog on successful submission of new quiz', fakeAsync(() => {
            quizCreatorSpy.submit.and.returnValue(of(true));
            component.submit();
            tick();
            expect(router.navigate).toHaveBeenCalledWith(['/admin/quiz/catalog']);
        }));

        it('should navigate to /admin/quiz/catalog on successful submission of mofified quiz', fakeAsync(() => {
            quizCreatorSpy.submit.and.returnValue(of(true));
            component.submit();
            tick();
            expect(router.navigate).toHaveBeenCalledWith(['/admin/quiz/catalog']);
        }));

        it('should open error message dialog if problem during quiz creation', fakeAsync(() => {
            quizCreatorSpy.submit.and.returnValue(of(false));
            component.submit();
            tick();
            expect(dialog.alert).toHaveBeenCalledWith('Erreur avec la création de quiz');
        }));

        it('should open error message dialog if problem during quiz modification', fakeAsync(() => {
            quizCreatorSpy.isModified.and.returnValue(true);
            quizCreatorSpy.submit.and.returnValue(of(false));
            component.submit();
            tick();
            expect(dialog.alert).toHaveBeenCalledWith('Erreur avec la modification de quiz');
        }));

        it('should drag and drop properly a choice in a list of choices', () => {
            const dragDropEvent = { previousIndex: 0, currentIndex: 1 } as CdkDragDrop<string[]>;
            const q2 = {} as Question;
            const q3 = {} as Question;
            const initialArray: Question[] = [q1, q2, q3];
            const expectedChange: Question[] = [q2, q1, q3];
            quizCreatorSpy.quiz.questions = initialArray;
            component.dropQuestion(dragDropEvent);
            expect(quizCreatorSpy.quiz.questions).toEqual(expectedChange);
        });

        it('should read file content', async () => {
            quizCreatorSpy.importQuizFile.and.callFake(async () => {
                quizCreatorSpy.quiz.title = testQuiz.title;
                quizCreatorSpy.quiz.description = testQuiz.description;
                return true;
            });

            const files = [{}] as unknown as FileList;
            const event = { currentTarget: { files } } as unknown as Event;
            await component.onFileSelected(event);

            expect(quizCreatorSpy.importQuizFile).toHaveBeenCalledOnceWith(files[0]);
            expect(component.formControls.title.value).toBe(testQuiz.title);
            expect(component.formControls.description.value).toBe(testQuiz.description);
        });

        it('should alert if file could not be imported', async () => {
            quizCreatorSpy.importQuizFile.and.callFake(async () => {
                return false;
            });

            const files = [{}] as unknown as FileList;
            const event = { currentTarget: { files } } as unknown as Event;
            await component.onFileSelected(event);

            expect(quizCreatorSpy.importQuizFile).toHaveBeenCalledOnceWith(files[0]);
            expect(dialog.alert).toHaveBeenCalled();
        });

        it('should not try to import if files is empty in event', async () => {
            const files = [] as unknown as FileList;
            const event = { currentTarget: { files } } as unknown as Event;
            await component.onFileSelected(event);

            expect(quizCreatorSpy.importQuizFile).not.toHaveBeenCalled();
        });

        it('should not try to import if no files in event', async () => {
            const event = { currentTarget: {} } as unknown as Event;
            await component.onFileSelected(event);

            expect(quizCreatorSpy.importQuizFile).not.toHaveBeenCalled();
        });

        it('should return { whitespace: true } if value contains only whitespace', () => {
            component.formControls.title.setValue('      ');
            expect(component.formControls.title.hasError('whitespace')).toBeTruthy();
        });

        it('should return { required: true } if value contains nothing', () => {
            component.formControls.title.setValue('');
            expect(component.formControls.title.hasError('required')).toBeTruthy();
        });
    });

    describe('with null id in url, ', () => {
        beforeEach(() => {
            init(null);
        });

        it('should not import quiz', () => {
            expect(quizCreatorSpy.init).toHaveBeenCalledOnceWith(null);
        });
    });
});
