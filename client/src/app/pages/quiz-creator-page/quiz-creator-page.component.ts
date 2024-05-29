import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { SteppedRange } from '@app/classes/stepped-range/stepped-range';
import { GlobalService } from '@app/services/global/global.service';
import { QuestionService } from '@app/services/question/question.service';
import { QuizCreatorService } from '@app/services/quiz-creator/quiz-creator.service';
import { Choice } from '@common/choice';
import { QuizConstants } from '@common/constants';
import { Question } from '@common/question';

@Component({
    selector: 'app-quiz-creator-page',
    templateUrl: './quiz-creator-page.component.html',
    styleUrls: ['./quiz-creator-page.component.scss'],
})
export class QuizCreatorPageComponent implements OnInit {
    maxLengthQuiz: number = QuizConstants.TITLE_MAX_LENGTH;
    maxLengthDescription: number = QuizConstants.DESCRIPTION_MAX_LENGTH;
    formControls: { [index: string]: FormControl } = {
        title: new FormControl('', [this.basicInputValidation()]),
        description: new FormControl('', [this.basicInputValidation()]),
    };

    constructor(
        private quizCreator: QuizCreatorService,
        private questionService: QuestionService,
        private global: GlobalService,
    ) {}

    ngOnInit(): void {
        this.quizCreator.init(this.global.getRoute().snapshot.paramMap.get('id')).subscribe(() => {
            this.setFormFields();
        });
    }

    getDuration(): number {
        return this.quizCreator.quiz.duration;
    }

    isModifying(): boolean {
        return this.quizCreator.isModified();
    }

    isValid(): boolean {
        return this.quizCreator.isValid();
    }

    onKeyTitle(event: KeyboardEvent): void {
        this.quizCreator.quiz.title = (event.target as HTMLInputElement).value;
    }

    onKeyDescription(event: KeyboardEvent): void {
        this.quizCreator.quiz.description = (event.target as HTMLInputElement).value;
    }

    onSelected(value: string): void {
        this.quizCreator.quiz.duration = parseInt(value, 10);
    }

    getQuestions(): Question[] {
        return this.quizCreator.quiz.questions;
    }

    getChoices(index: number): Choice[] {
        const q = this.getQuestions()[index];
        return q.choices ? q.choices : [];
    }

    durationValues(): number[] {
        return new SteppedRange(QuizConstants.MIN_DURATION, QuizConstants.MAX_DURATION, QuizConstants.DURATION_STEP).asArray();
    }

    openQuestionDialog(): void {
        this.global.dialog.createQuestionDialog().subscribe((result: Question | undefined) => {
            if (result) {
                this.getQuestions().push(result);
            }
        });
    }

    modifyQuestion(index: number, event: MouseEvent): void {
        event.stopPropagation();
        this.global.dialog.createQuestionDialog(this.getQuestions()[index]).subscribe((question: Question | undefined) => {
            if (question) {
                this.getQuestions()[index] = question;
            }
        });
    }

    removeQuestion(index: number): void {
        this.getQuestions().splice(index, 1);
    }

    addQuestionToDb(index: number, event: MouseEvent): void {
        event.stopPropagation();
        this.questionService.addQuestion(this.getQuestions()[index]).subscribe((success: boolean) => {
            if (!success) {
                this.global.dialog.alert('Question existe déjà dans la banque');
            }
        });
    }

    dropQuestion(event: CdkDragDrop<string[]>): void {
        moveItemInArray(this.getQuestions(), event.previousIndex, event.currentIndex);
    }

    pickQuestions(): void {
        this.global.dialog.pickQuestionsDialog().subscribe((questions: Question[] | undefined) => {
            if (questions) {
                this.getQuestions().push(...questions);
            }
        });
    }

    submit(): void {
        this.quizCreator.submit().subscribe((success: boolean) => {
            if (success) {
                this.global.router.navigate(['/admin/quiz/catalog']);
            } else {
                this.global.dialog.alert(`Erreur avec la ${this.operationString()} de quiz`);
            }
        });
    }

    async onFileSelected(event: Event): Promise<void> {
        const files = (event.currentTarget as HTMLInputElement).files;
        if (!files || files.length === 0) return;

        if (await this.quizCreator.importQuizFile(files[0])) {
            this.setFormFields();
        } else {
            this.global.dialog.alert('Échec dans la lecture du fichier');
        }
    }

    // adapted from: https://blog.angular-university.io/angular-custom-validators/
    basicInputValidation(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (Validators.required(control) !== null) return { required: true };
            if (control.value.trim().length === 0) return { whitespace: true };
            return null;
        };
    }

    private operationString(): string {
        return this.quizCreator.isModified() ? 'modification' : 'création';
    }

    private setFormFields(): void {
        this.formControls.title.setValue(this.quizCreator.quiz.title);
        this.formControls.description.setValue(this.quizCreator.quiz.description);
    }
}
