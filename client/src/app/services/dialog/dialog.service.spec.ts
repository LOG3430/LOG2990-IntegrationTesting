import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AlertComponent } from '@app/components/alert/alert.component';
import { PasswordDialogComponent } from '@app/components/password-dialog/password-dialog.component';
import { PickQuestionComponent } from '@app/components/quiz/pick-question/pick-question.component';
import { QuizQuestionComponent } from '@app/components/quiz/quiz-question/quiz-question.component';
import { Question } from '@common/question';
import { of } from 'rxjs';

import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { DialogService } from './dialog.service';

describe('DialogService', () => {
    let service: DialogService;
    let dialog: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        dialog = jasmine.createSpyObj('MatDialog', ['open']);

        TestBed.configureTestingModule({
            imports: [MatDialogModule],
            providers: [{ provide: MatDialog, useValue: dialog }],
        });

        service = TestBed.inject(DialogService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should be able to open an alert', () => {
        const msg = '...';
        service.alert(msg);
        expect(dialog.open).toHaveBeenCalledWith(AlertComponent, { data: msg });
    });

    it('should allow opening the pick question dialog', () => {
        service.openPickQuestionDialog();
        expect(dialog.open).toHaveBeenCalled();
    });

    it('should allow opening the create question dialog with a question', () => {
        const question = { foo: 1 } as unknown as Question;
        service.openCreateQuestionDialog(question);
        expect(dialog.open).toHaveBeenCalledWith(QuizQuestionComponent, { data: question });
    });

    it('should allow opening the create question dialog without a question', () => {
        service.openCreateQuestionDialog();
        expect(dialog.open).toHaveBeenCalledWith(QuizQuestionComponent, { data: undefined });
    });

    it('should allow opening the password verification dialog', () => {
        service.openPasswordDialog();
        expect(dialog.open).toHaveBeenCalledWith(PasswordDialogComponent, { data: { password: '' } });
    });

    it('createQuestionDialog should return observable of question', () => {
        const createQuestionDialogSpy = jasmine.createSpyObj<MatDialogRef<QuizQuestionComponent, Question>>('QuizQuestionComponent', [
            'beforeClosed',
        ]);

        createQuestionDialogSpy.beforeClosed.and.returnValue(of(undefined));
        dialog.open.and.returnValue(createQuestionDialogSpy);
        service.createQuestionDialog().subscribe((val: Question | undefined) => expect(val).toBeUndefined());
    });

    it('pickQuestionDialog should return observable of empty list when they are none', () => {
        const pickQuestionDialogSpy = jasmine.createSpyObj<MatDialogRef<PickQuestionComponent, Question[]>>('PickQuestionComponent', [
            'beforeClosed',
        ]);

        pickQuestionDialogSpy.beforeClosed.and.returnValue(of(undefined));
        dialog.open.and.returnValue(pickQuestionDialogSpy);
        service.pickQuestionsDialog().subscribe((val: Question[]) => expect(val).toEqual([]));
    });

    it('pickQuestionDialog should return observable of list of questions', () => {
        const questions: Question[] = [{} as Question, {} as Question];
        const pickQuestionDialogSpy = jasmine.createSpyObj<MatDialogRef<PickQuestionComponent, Question[]>>('PickQuestionComponent', [
            'beforeClosed',
        ]);

        pickQuestionDialogSpy.beforeClosed.and.returnValue(of(questions));
        dialog.open.and.returnValue(pickQuestionDialogSpy);
        service.pickQuestionsDialog().subscribe((val: Question[]) => expect(val).toEqual(questions));
    });

    it('confirmLeave dialog should call dialog.open', () => {
        const confirmLeaveDialogSpy = jasmine.createSpyObj<MatDialogRef<ConfirmComponent, boolean>>('ConfirmLeaveComponent', ['beforeClosed']);

        confirmLeaveDialogSpy.beforeClosed.and.returnValue(of(true));
        dialog.open.and.returnValue(confirmLeaveDialogSpy);
        service.confirmDialog('').subscribe((val: boolean) => expect(val).toBeTruthy());
    });
});
