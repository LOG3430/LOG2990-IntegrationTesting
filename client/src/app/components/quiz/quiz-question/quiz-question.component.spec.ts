import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { McqPanelComponent } from '@app/components/mcq-panel/mcq-panel.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionCreatorService } from '@app/services/question-creator/question-creator.service';
import { QuestionService } from '@app/services/question/question.service';
import { QuestionConstants } from '@common/constants';
import { Question } from '@common/question';
import { of } from 'rxjs';
import { QuizQuestionComponent } from './quiz-question.component';

describe('QuizQuestionComponent', () => {
    let component: QuizQuestionComponent;
    let fixture: ComponentFixture<QuizQuestionComponent>;
    let serviceQuestionCreatorSpy: jasmine.SpyObj<QuestionCreatorService>;
    let dialogRef: MatDialogRef<QuizQuestionComponent, Question>;

    let questionSpy: jasmine.SpyObj<QuestionService>;
    const payload = [{ id: 'foobar' } as unknown as Question];

    const init = async (data?: Question) => {
        questionSpy = jasmine.createSpyObj('QuestionService', ['getAllQuestions']);
        serviceQuestionCreatorSpy = jasmine.createSpyObj('QuestionCreatorService', [
            'getQuestion',
            'getChoices',
            'onSelected',
            'isValidQuestion',
            'init',
            'setTypeQuestion',
            'initEmptyChoices',
        ]);

        questionSpy.getAllQuestions.and.returnValue(of(payload));
        serviceQuestionCreatorSpy.getQuestion.and.returnValue({} as unknown as Question);

        await TestBed.configureTestingModule({
            imports: [AppMaterialModule, NoopAnimationsModule, FormsModule, ReactiveFormsModule],
            declarations: [QuizQuestionComponent, McqPanelComponent],
            providers: [
                {
                    provide: MatDialogRef<QuizQuestionComponent, Question>,
                    useFactory: () => {
                        dialogRef = TestBed.inject(MatDialog).open(QuizQuestionComponent);
                        return dialogRef;
                    },
                },
                { provide: QuestionService, useValue: questionSpy },
                { provide: QuestionCreatorService, useValue: serviceQuestionCreatorSpy },
                { provide: MAT_DIALOG_DATA, useValue: data },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(QuizQuestionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    };

    describe('with data', () => {
        beforeEach(async () => {
            await init({} as Question);
        });

        it('should be modifying', () => {
            expect(component.isModifying).toBeTruthy();
        });
    });

    describe('without data', () => {
        beforeEach(async () => {
            await init();
        });

        it('should not be modifying', () => {
            expect(component.isModifying).toBeFalsy();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should provide the right constants for input fields lengths', () => {
            expect(component.maxAnswerLength()).toEqual(QuestionConstants.MAX_ANSWER_LENGTH);
        });

        it('should change point type from string to integer ', () => {
            spyOn(component, 'onSelected').and.callThrough();
            const pointString = '10';
            component.onSelected(pointString);
            expect(serviceQuestionCreatorSpy.onSelected).toHaveBeenCalled();
        });

        it('should cancel when button is clicked', () => {
            spyOn(component, 'onNoClick');
            const button = fixture.debugElement.query(By.css('button[mat-raised-button].close')).nativeElement;
            button.click();
            expect(component.onNoClick).toHaveBeenCalled();
        });

        it('should call questionCreator service when button is confirmed', () => {
            spyOn(dialogRef, 'close');
            const fakeQuestion = {} as Question;
            serviceQuestionCreatorSpy.getQuestion.and.returnValue(fakeQuestion);
            component.confirm();
            expect(dialogRef.close).toHaveBeenCalledWith(fakeQuestion);
            expect(serviceQuestionCreatorSpy.getQuestion).toHaveBeenCalled();
        });

        it('should update Question text and validate question on key event', () => {
            const newTextUpdate = 'New Choice Text';
            const mockEventKeyboard: Partial<KeyboardEvent> = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                target: { value: newTextUpdate } as any,
            };
            serviceQuestionCreatorSpy.getQuestion.and.returnValue(payload[0]);
            component.onKeyQuestion(mockEventKeyboard as KeyboardEvent);
            expect(component.getQuestion().text).toBe(newTextUpdate);
        });

        it('should return null if control value is not empty', () => {
            const validationFct = component.basicInputValidation();
            const control: AbstractControl = { value: 'test' } as AbstractControl;
            expect(validationFct(control)).toBeNull();
        });

        it('should return whitespace error if control value only contains whitespaces', () => {
            const validationFct = component.basicInputValidation();
            const control: AbstractControl = { value: '      ' } as AbstractControl;
            expect(validationFct(control)).toEqual({ whitespace: true });
        });

        it('should return required error if control value is empty', () => {
            const validationFct = component.basicInputValidation();
            const control: AbstractControl = { value: '' } as AbstractControl;
            expect(validationFct(control)).toEqual({ required: true });
        });

        it('should close when button Annuler is clicked', () => {
            spyOn(component, 'onNoClick').and.callThrough();
            const button = fixture.debugElement.query(By.css('.close')).nativeElement;
            button.click();
            expect(component.onNoClick).toHaveBeenCalled();
        });

        it('should change the type of the question when we toggle', () => {
            component.setTypeQuestion();
            expect(serviceQuestionCreatorSpy.setTypeQuestion).toHaveBeenCalled();
        });
    });
});
