import { Component, OnInit } from '@angular/core';
import { DialogService } from '@app/services/dialog/dialog.service';
import { QuestionService } from '@app/services/question/question.service';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-question-catalog',
    templateUrl: './question-catalog.component.html',
    styleUrls: ['./question-catalog.component.scss'],
})
export class QuestionCatalogComponent implements OnInit {
    filterList: Question[] = [];
    private questions: Question[] = [];

    constructor(
        private readonly questionService: QuestionService,
        private dialogService: DialogService,
    ) {}

    ngOnInit(): void {
        this.refreshQuestions();
    }

    modifyQuestion(question: Question, event: MouseEvent): void {
        event.stopPropagation();
        this.dialogService
            .openCreateQuestionDialog(question)
            .beforeClosed()
            .subscribe((modified: Question | undefined) => {
                if (!modified) return;
                this.questionService.modifyQuestion(question.id, modified).subscribe(() => {
                    this.refreshQuestions();
                });
            });
    }

    removeQuestion(question: Question, event: MouseEvent): void {
        event.stopPropagation();
        this.dialogService.confirmDialog('Êtes-vous sur de vouloir supprimer cette question?').subscribe((confirm: boolean) => {
            this.confirmDelete(question, confirm);
            this.refreshQuestions();
        });
    }

    addQuestion(): void {
        this.dialogService.createQuestionDialog().subscribe((result: Question | undefined) => {
            if (!result) return;
            this.addQuestionToDb(result).subscribe((res: boolean) => {
                if (!res) {
                    this.dialogService.alert('Question existe déjà dans la banque');
                }
                this.refreshQuestions();
            });
        });
    }

    addQuestionToDb(question: Question): Observable<boolean> {
        return this.questionService.addQuestion(question);
    }

    filterMCQ(): void {
        this.filterQuestions(QTypes.MCQ);
    }

    filterLAQ(): void {
        this.filterQuestions(QTypes.LAQ);
    }

    filterAll(): void {
        this.filterList = this.questions;
    }

    getColorByType(question: Question): string {
        return question.type === QTypes.MCQ ? 'var(--lightprimary)' : 'var(--primary)';
    }

    private confirmDelete(question: Question, confirmation: boolean) {
        if (confirmation)
            this.questionService.deleteQuestion(question.id).subscribe((res: boolean) => {
                const confirmationText = res ? 'La question a été supprimée avec succès' : "Une erreur s'est produite";
                this.dialogService.alert(confirmationText);
            });
    }

    private filterQuestions(type: QTypes): void {
        this.filterList = this.questions.filter((question) => question.type === type);
    }

    private refreshQuestions(): void {
        this.questionService.getAllQuestions().subscribe((result: Question[]) => {
            if (result.length === 0) {
                this.dialogService.alert('Aucune question trouvée');
            }
            this.filterList = this.questions = result;
        });
    }
}
