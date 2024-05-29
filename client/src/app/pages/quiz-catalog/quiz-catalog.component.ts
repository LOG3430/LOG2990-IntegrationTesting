import { Component, OnInit } from '@angular/core';
import { AdminService } from '@app/services/admin/admin.service';
import { GlobalService } from '@app/services/global/global.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { Quiz } from '@common/quiz';
import { saveAs } from 'file-saver';

@Component({
    selector: 'app-quiz-catalog',
    templateUrl: './quiz-catalog.component.html',
    styleUrls: ['./quiz-catalog.component.scss'],
})
export class QuizCatalogComponent implements OnInit {
    quizzes: Quiz[] = [];

    constructor(
        private readonly adminService: AdminService,
        private readonly quizService: QuizService,
        private readonly global: GlobalService,
    ) {}

    ngOnInit() {
        this.refreshQuizzes();
    }

    exportQuiz(quiz: Quiz, event: MouseEvent): void {
        event.stopPropagation();
        const blob = new Blob([JSON.stringify(quiz)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `${quiz.title}.json`);
    }

    modifyQuiz(quiz: Quiz, event: MouseEvent): void {
        event.stopPropagation();

        this.global.router.navigate(['/admin/quiz/modify', { id: quiz.id }]);
    }

    deleteQuiz(quiz: Quiz, event: MouseEvent): void {
        event.stopPropagation();
        this.global.dialog.confirmDialog(`Êtes-vous sur de vouloir supprimer le quiz: ${quiz.title} ?`).subscribe((confirmation: boolean) => {
            this.confirmDelete(quiz, confirmation);
            this.refreshQuizzes();
        });
    }

    async toggleVisibility(quiz: Quiz, event: MouseEvent): Promise<void> {
        event.stopPropagation();
        quiz.visibility = !quiz.visibility;
        this.adminService.updateQuiz(quiz).subscribe();
    }

    private refreshQuizzes(): void {
        this.quizService.getAllQuizzes().subscribe((result: Quiz[]) => {
            if (result.length === 0) {
                this.global.dialog.alert('Aucun quiz trouvé');
            }

            this.quizzes = result;
        });
    }

    private confirmDelete(quiz: Quiz, confirmation: boolean) {
        if (confirmation)
            this.adminService.deleteQuiz(quiz.id).subscribe((res) => {
                const confirmationText = res ? `Le quiz ${quiz.title} a été supprimé avec succès` : "Une erreur s'est produite";
                this.global.dialog.alert(confirmationText);
            });
    }
}
