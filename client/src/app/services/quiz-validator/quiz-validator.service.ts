import { Injectable } from '@angular/core';
import { SteppedRange } from '@app/classes/stepped-range/stepped-range';
import { QuestionValidatorService } from '@app/services/question-validation/question-validator.service';
import { QuizConstants } from '@common/constants';
import { Question } from '@common/question';
import { Quiz } from '@common/quiz';

@Injectable({
    providedIn: 'root',
})
export class QuizValidatorService {
    constructor(private questionValidator: QuestionValidatorService) {}

    isValid(quiz: Quiz): boolean {
        return this.isValidDescription(quiz.description) && this.isValidTitle(quiz.title) && quiz.questions.length > 0;
    }

    isValidDuration(duration: number) {
        return new SteppedRange(QuizConstants.MIN_DURATION, QuizConstants.MAX_DURATION, QuizConstants.DURATION_STEP).contains(duration);
    }

    isValidTitle(title: string): boolean {
        return title.trim().length !== 0;
    }

    isValidDescription(description: string): boolean {
        return !!description.trim();
    }

    areValidQuestions(questions: Question[]): boolean {
        return questions.length > 0 && questions.reduce((acc, q) => acc && this.isValidQuestion(q), true);
    }

    isValidQuestion(question: Question): boolean {
        return this.questionValidator.isValid(question);
    }
}
