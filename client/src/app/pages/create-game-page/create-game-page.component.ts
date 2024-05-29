import { Component } from '@angular/core';
import { QuizService } from '@app/services/quiz/quiz.service';
import { Quiz } from '@common/quiz';

@Component({
    selector: 'app-create-game-page',
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss'],
})
export class CreateGamePageComponent {
    private quizzes: Quiz[];
    private selectedQuiz: Quiz;

    constructor(private quizService: QuizService) {
        this.updateGames();
    }

    getGames(): Quiz[] {
        return this.quizzes;
    }

    updateGames(): void {
        this.quizService.getAllQuizzes().subscribe((quizzes) => {
            this.quizzes = quizzes?.filter((g) => g.visibility);
        });
    }

    selectQuiz(quiz: Quiz): void {
        this.selectedQuiz = quiz;
    }

    isSelected(quiz: Quiz): boolean {
        return this.selectedQuiz && this.selectedQuiz.id === quiz.id;
    }
}
