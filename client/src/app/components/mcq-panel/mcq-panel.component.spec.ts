import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionCreatorService } from '@app/services/question-creator/question-creator.service';
import { Choice } from '@common/choice';
import { Question } from '@common/question';
import { McqPanelComponent } from './mcq-panel.component';

describe('McqPanelComponent', () => {
    let component: McqPanelComponent;
    let fixture: ComponentFixture<McqPanelComponent>;
    let serviceSpy: jasmine.SpyObj<QuestionCreatorService>;
    let c1: Choice;
    let c2: Choice;
    let c3: Choice;
    let q1: Question;
    let testChoices: Choice[];

    beforeEach(() => {
        c1 = { text: 'choice 0', isCorrect: true };
        c2 = { text: 'choice 1', isCorrect: false };
        c3 = { text: 'choice 2', isCorrect: false };
        testChoices = [c1, c2, c3];
        q1 = { choices: testChoices } as unknown as Question;
        serviceSpy = jasmine.createSpyObj('McqCreatorService', ['init', 'getChoices', 'getQuestion', 'addChoice', 'deleteChoice']);
        serviceSpy.getChoices.and.returnValue(testChoices);
        serviceSpy.getQuestion.and.returnValue(q1);

        TestBed.configureTestingModule({
            imports: [AppMaterialModule, FormsModule, ReactiveFormsModule, NoopAnimationsModule],
            declarations: [McqPanelComponent],
            providers: [{ provide: QuestionCreatorService, useValue: serviceSpy }],
        });
        fixture = TestBed.createComponent(McqPanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return all the choices', () => {
        expect(component.getChoices()).toEqual(testChoices);
    });

    it('should drag and drop properly a choice in a list of choices', () => {
        const dragDropEvent = { previousIndex: 0, currentIndex: 1 } as CdkDragDrop<string[]>;
        const expectedChange: Choice[] = [c2, c1, c3];

        component.formControls = {
            // eslint-disable-next-line @typescript-eslint/naming-convention, no-unused-vars, @typescript-eslint/no-empty-function
            choice_1: { setValue: (str) => {} } as FormControl,
            // eslint-disable-next-line @typescript-eslint/naming-convention, no-unused-vars, @typescript-eslint/no-empty-function
            choice_2: { setValue: (str) => {} } as FormControl,
            // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/naming-convention, no-unused-vars
            choice_3: { setValue: (str) => {} } as FormControl,
        };
        spyOn(component, 'updateFormControls').and.callThrough();
        component.drop(dragDropEvent);
        expect(component.getChoices()).toEqual(expectedChange);
    });

    it('should tooggle choice validity', () => {
        component.onClickValidity(0);
        expect(component.getChoices()[0].isCorrect).toBeFalse();
    });

    it('should change choice text input', () => {
        const newTextUpdate = 'New Choice Text';
        const mockEventKeyboard: Partial<KeyboardEvent> = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            target: { value: newTextUpdate } as any,
        };
        component.onKeyChoice(mockEventKeyboard as KeyboardEvent, 0);
        expect(component.getChoices()[0].text).toBe(newTextUpdate);
    });

    it('should add a choice up to the max choices limit', () => {
        serviceSpy.addChoice.and.returnValue(true);
        component.addChoice();
        expect(component.formControls[`choice_${component.getChoices().length}`]).toBeDefined();
    });

    it('should not add a choice when breach max choices limit', () => {
        serviceSpy.addChoice.and.returnValue(false);
        component.addChoice();
        expect(component.formControls[`choice_${component.getChoices().length + 1}`]).toBeUndefined();
    });

    it('should delete right choice', () => {
        component.deleteChoice(0);
        expect(serviceSpy.deleteChoice).toHaveBeenCalled();
    });

    it('should return whitespace error if control value only contains whitespaces', () => {
        const validationFct = component.basicInputValidation();
        const control: AbstractControl = { value: '      ' } as AbstractControl;
        expect(validationFct(control)).toEqual({ whitespace: true });
    });

    it('should update form controls with choice text on updateFormControls call', () => {
        testChoices.forEach((choice, i) => {
            component.formControls[`choice_${i + 1}`] = new FormControl('');
        });

        const newChoicesText = ['Updated Choice 1', 'Updated Choice 2'];
        component.getChoices().forEach((choice, index) => {
            choice.text = newChoicesText[index];
        });

        component.updateFormControls();

        newChoicesText.forEach((text, index) => {
            expect(component.formControls[`choice_${index + 1}`].value).toEqual(text);
        });
    });
});
