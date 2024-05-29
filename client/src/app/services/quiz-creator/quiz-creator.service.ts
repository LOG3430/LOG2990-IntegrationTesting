import { Injectable } from '@angular/core';
import { Factory } from '@app/classes/factory/factory';
import { AdminService } from '@app/services/admin/admin.service';
import { QuizValidatorService } from '@app/services/quiz-validator/quiz-validator.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { Question } from '@common/question';
import { Quiz } from '@common/quiz';
import { map, Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class QuizCreatorService {
    quiz: Quiz;
    private isModifying: boolean;

    constructor(
        private quizService: QuizService,
        private quizValidator: QuizValidatorService,
        private admin: AdminService,
    ) {}

    init(quizId: string | null): Observable<void> {
        this.newQuiz();
        if (!quizId) return of();

        return this.quizService.getQuiz(quizId).pipe(
            map((res) => {
                this.quiz = res;
                this.isModifying = true;
            }),
        );
    }

    isModified(): boolean {
        return this.isModifying;
    }

    isValid(): boolean {
        return this.quizValidator.isValid(this.quiz);
    }

    submit(): Observable<boolean> {
        return this.isValid() ? this.submitQuiz() : of(false);
    }

    async importQuizFile(file: Blob): Promise<boolean> {
        return this.readFile(file)
            .then((content: string) => {
                this.importQuiz(JSON.parse(content));
                return true;
            })
            .catch(() => false);
    }

    private async readFile(file: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result?.toString();
                if (content) {
                    resolve(content);
                } else {
                    reject();
                }
            };
            reader.readAsText(file);
        });
    }

    private importQuiz(content: Quiz) {
        this.newQuiz();
        this.importTitle(this.getProperty(content, 'title'));
        this.importDescription(this.getProperty(content, 'description'));
        this.importDuration(this.getProperty(content, 'duration'));
        this.importQuestions(this.getProperty(content, 'questions'));
    }

    private getProperty<T>(content: Quiz, property: keyof Quiz): T | null {
        return Object.prototype.hasOwnProperty.call(content, property) ? (content[property] as T) : null;
    }

    private importTitle(title: string | null) {
        if (title && this.quizValidator.isValidTitle(title)) {
            this.quiz.title = title;
        }
    }

    private importDescription(description: string | null) {
        if (description && this.quizValidator.isValidDescription(description)) {
            this.quiz.description = description;
        }
    }

    private importDuration(duration: number | null) {
        if (duration && this.quizValidator.isValidDuration(duration)) {
            this.quiz.duration = duration;
        }
    }

    private importQuestions(questions: Question[] | null) {
        if (questions) {
            this.quiz.questions = questions.filter((q) => this.quizValidator.isValidQuestion(q));
        }
    }

    private submitQuiz() {
        return this.isModifying ? this.admin.updateQuiz(this.quiz) : this.admin.submitNewQuiz(this.quiz);
    }

    private newQuiz() {
        this.isModifying = false;
        this.quiz = Factory.makeQuiz();
    }
}
