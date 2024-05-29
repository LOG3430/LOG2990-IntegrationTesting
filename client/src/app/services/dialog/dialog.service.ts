import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AlertComponent } from '@app/components/alert/alert.component';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { PasswordDialogComponent } from '@app/components/password-dialog/password-dialog.component';
import { PickQuestionComponent } from '@app/components/quiz/pick-question/pick-question.component';
import { QuizQuestionComponent } from '@app/components/quiz/quiz-question/quiz-question.component';
import { Question } from '@common/question';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DialogService {
    constructor(private dialog: MatDialog) {}

    alert(message: string): MatDialogRef<AlertComponent, void> {
        return this.dialog.open(AlertComponent, { data: message });
    }

    openPickQuestionDialog(): MatDialogRef<PickQuestionComponent, Question[]> {
        return this.dialog.open(PickQuestionComponent);
    }

    openCreateQuestionDialog(question?: Question): MatDialogRef<QuizQuestionComponent, Question> {
        return this.dialog.open(QuizQuestionComponent, { data: question });
    }

    openPasswordDialog(): MatDialogRef<PasswordDialogComponent, string> {
        return this.dialog.open(PasswordDialogComponent, { data: { password: '' } });
    }

    createQuestionDialog(question?: Question): Observable<Question | undefined> {
        return this.openCreateQuestionDialog(question).beforeClosed();
    }

    pickQuestionsDialog(): Observable<Question[]> {
        return this.openPickQuestionDialog()
            .beforeClosed()
            .pipe(
                map((questions: Question[] | undefined) => {
                    return questions ? questions : [];
                }),
            );
    }

    confirmDialog(message: string): Observable<boolean> {
        return this.dialog.open(ConfirmComponent, { data: message }).beforeClosed();
    }
}
