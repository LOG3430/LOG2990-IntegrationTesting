import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SteppedRange } from '@app/classes/stepped-range/stepped-range';
import { QuestionCreatorService } from '@app/services/question-creator/question-creator.service';
import { QuestionConstants } from '@common/constants';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';

@Component({
    selector: 'app-quiz-question',
    templateUrl: './quiz-question.component.html',
    styleUrls: ['./quiz-question.component.scss'],
})
export class QuizQuestionComponent {
    @Output() mcqContent = new EventEmitter<Question>();
    isModifying: boolean;

    formControls: { [index: string]: FormControl } = {
        title: new FormControl('', [this.basicInputValidation()]),
    };

    constructor(
        private serviceQuestionCreator: QuestionCreatorService,
        public dialogRef: MatDialogRef<QuizQuestionComponent, Question>,
        @Inject(MAT_DIALOG_DATA) data?: Question,
    ) {
        this.isModifying = !!data;
        this.init(data);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    confirm(): void {
        this.dialogRef.close(this.serviceQuestionCreator.getQuestion());
    }

    isValid(question: Question): boolean {
        return this.serviceQuestionCreator.isValidQuestion(question);
    }

    onKeyQuestion(event: KeyboardEvent): void {
        this.serviceQuestionCreator.getQuestion().text = (event.target as HTMLInputElement).value;
    }

    getQuestion(): Question {
        return this.serviceQuestionCreator.getQuestion();
    }

    onSelected(value: string): void {
        this.serviceQuestionCreator.onSelected(value);
    }

    maxAnswerLength(): number {
        return QuestionConstants.MAX_ANSWER_LENGTH;
    }

    pointsValues(): number[] {
        return new SteppedRange(QuestionConstants.MIN_POINTS, QuestionConstants.MAX_POINTS, QuestionConstants.POINTS_STEP).asArray();
    }

    setTypeQuestion(): void {
        this.serviceQuestionCreator.setTypeQuestion();
    }

    isMCQ(): boolean {
        return this.getQuestion().type === QTypes.MCQ;
    }

    // adapted from: https://blog.angular-university.io/angular-custom-validators/
    basicInputValidation(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (Validators.required(control) !== null) return { required: true };
            if (control.value.trim().length === 0) return { whitespace: true };
            return null;
        };
    }

    private init(data?: Question) {
        this.serviceQuestionCreator.init(data);
        this.formControls.title.setValue(this.serviceQuestionCreator.getQuestion().text);
    }
}
