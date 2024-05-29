import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { QuestionService } from '@app/services/question/question.service';
import { Question } from '@common/question';

@Component({
    selector: 'app-pick-question',
    templateUrl: './pick-question.component.html',
    styleUrls: ['./pick-question.component.scss'],
})
export class PickQuestionComponent {
    panelOpenState: boolean = false;
    private questions: Question[] = [];
    private selectedQuestions: Question[] = [];

    constructor(
        private dialogRef: MatDialogRef<PickQuestionComponent, Question[]>,
        questionService: QuestionService,
    ) {
        this.loadQuestions(questionService);
    }

    cancel(): void {
        this.dialogRef.close();
    }

    confirm(): void {
        this.dialogRef.close(this.selectedQuestions);
    }

    toggleSelectQuestion(question: Question, event: MouseEvent): void {
        event.stopPropagation();
        if (this.isSelected(question)) {
            this.unselect(question);
        } else {
            this.selectedQuestions.push(question);
        }
    }

    getQuestions(): Question[] {
        return this.questions;
    }

    isSelected(question: Question): boolean {
        return this.selectedQuestions.find((q) => q.id === question.id) !== undefined;
    }

    getTooltip(question: Question): string {
        return this.isSelected(question) ? 'Désélectionner' : 'Sélectionner';
    }

    private unselect(question: Question): void {
        this.selectedQuestions = this.selectedQuestions.filter((q) => q.id !== question.id);
    }

    private loadQuestions(questionService: QuestionService): void {
        questionService.getAllQuestions().subscribe((questions: Question[]) => {
            this.questions = questions;
        });
    }
}
