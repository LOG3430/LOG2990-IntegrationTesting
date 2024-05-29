import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionService } from '@app/services/question/question.service';
import { Question } from '@common/question';
import { of } from 'rxjs';
import { PickQuestionComponent } from './pick-question.component';

describe('PickQuestionComponent', () => {
    let component: PickQuestionComponent;
    let fixture: ComponentFixture<PickQuestionComponent>;
    let dialogRef: MatDialogRef<PickQuestionComponent, Question[]>;

    let questionSpy: jasmine.SpyObj<QuestionService>;
    let eventSpy: jasmine.SpyObj<MouseEvent>;
    const payload = [{ id: 'foobar' } as unknown as Question];

    beforeEach(async () => {
        questionSpy = jasmine.createSpyObj('QuestionService', ['getAllQuestions']);
        eventSpy = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);
        questionSpy.getAllQuestions.and.returnValue(of(payload));

        await TestBed.configureTestingModule({
            imports: [AppMaterialModule, NoopAnimationsModule, FormsModule],
            declarations: [PickQuestionComponent],
            providers: [
                {
                    provide: MatDialogRef<PickQuestionComponent, Question[]>,
                    useFactory: () => {
                        dialogRef = TestBed.inject(MatDialog).open(PickQuestionComponent);
                        return dialogRef;
                    },
                },
                { provide: QuestionService, useValue: questionSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PickQuestionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', async () => {
        expect(component).toBeTruthy();
    });

    it('should load questions using the service on creation', () => {
        // MBB: For some reason, this is called twice in tests.
        // I found very little documentation about testing dialogs,
        // the weird factory will have to do.
        expect(questionSpy.getAllQuestions).toHaveBeenCalledTimes(2);
        expect(component.getQuestions()).toBe(payload);
    });

    it('Should correctly toggle a game as selected', () => {
        expect(component.isSelected(payload[0])).toBeFalse();
        component.toggleSelectQuestion(payload[0], eventSpy);
        expect(eventSpy.stopPropagation).toHaveBeenCalled();
        expect(component.isSelected(payload[0])).toBeTrue();
        component.toggleSelectQuestion(payload[0], eventSpy);
        expect(eventSpy.stopPropagation).toHaveBeenCalledTimes(2);
        expect(component.isSelected(payload[0])).toBeFalse();
    });

    it('Should provide selected questions on confirm', () => {
        dialogRef.beforeClosed().subscribe((questions: Question[] | undefined) => {
            expect(questions).toEqual(payload);
        });
        // Native JS returns in document order, assume the same.
        // I would rather not add ids just for testing
        // https://www.w3.org/TR/selectors-api/#queryselectorall
        const confirm = fixture.debugElement.queryAll(By.css('div[mat-dialog-actions] > button[mat-raised-button]'))[1];

        component.toggleSelectQuestion(payload[0], eventSpy);
        expect(eventSpy.stopPropagation).toHaveBeenCalled();
        confirm.nativeElement.click();
    });

    it('Should provide undefined on cancel', () => {
        dialogRef.beforeClosed().subscribe((questions: Question[] | undefined) => {
            expect(questions).toBeUndefined();
        });
        // Native JS returns in document order, assume the same.
        // I would rather not add ids just for testing
        // https://www.w3.org/TR/selectors-api/#queryselectorall
        const cancel = fixture.debugElement.queryAll(By.css('div[mat-dialog-actions] > button[mat-raised-button]'))[0];

        component.toggleSelectQuestion(payload[0], eventSpy);
        expect(eventSpy.stopPropagation).toHaveBeenCalled();
        cancel.nativeElement.click();
    });

    it('Should return Sélectionner Tooltip string if isSelected is false', () => {
        expect(component.getTooltip(payload[0])).toEqual('Sélectionner');
    });

    it('Should return Désélectionner Tooltip string if isSelected is true', () => {
        component.toggleSelectQuestion(payload[0], eventSpy);
        expect(component.getTooltip(payload[0])).toEqual('Désélectionner');
    });
});
