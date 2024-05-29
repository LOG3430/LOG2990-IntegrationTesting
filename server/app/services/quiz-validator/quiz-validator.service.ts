import { isInRange } from '@app/utils/isinrange';
import { Choice } from '@common/choice';
import { QuestionConstants, QuizConstants } from '@common/constants';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { Quiz } from '@common/quiz';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QuizValidatorService {
    validateQuiz(quiz: Quiz): boolean {
        if (!this.hasAttributes(quiz)) return false;
        return (
            this.validateTitle(quiz.title) &&
            this.validateDescription(quiz.description) &&
            this.validateDuration(quiz.duration) &&
            this.validateQuestions(quiz.questions)
        );
    }
    validateQuestion(question: Question): boolean {
        return this.validateAnswer(question) && this.validatePoints(question.points);
    }

    private hasAttributes(quiz: Quiz) {
        const attributes = ['id', 'title', 'description', 'duration', 'lastModification', 'questions', 'visibility'];
        for (const attribute of attributes) {
            if (!Object.prototype.hasOwnProperty.call(quiz, attribute)) {
                return false;
            }
        }
        return true;
    }

    private validateTitle(title: string): boolean {
        return isInRange(title.length, QuizConstants.STRING_MIN_LENGTH, QuizConstants.TITLE_MAX_LENGTH);
    }

    private validateDuration(duration: number): boolean {
        return isInRange(duration, QuizConstants.MIN_DURATION, QuizConstants.MAX_DURATION, QuizConstants.DURATION_STEP);
    }

    private validateDescription(description: string): boolean {
        return isInRange(description.length, QuizConstants.STRING_MIN_LENGTH, QuizConstants.DESCRIPTION_MAX_LENGTH);
    }

    private hasOneOfEach(choices: Choice[]): boolean {
        return choices.some((choice) => !choice.isCorrect) && choices.some((choice) => choice.isCorrect);
    }

    private validateAnswer(question: Question): boolean {
        if (question.type === QTypes.LAQ) return !question.choices;
        return this.hasOneOfEach(question.choices);
    }

    private validatePoints(points: number): boolean {
        return isInRange(points, QuestionConstants.MIN_POINTS, QuestionConstants.MAX_POINTS, QuestionConstants.POINTS_STEP);
    }

    private validateQuestions(questions: Question[]): boolean {
        return questions.reduce((acc, question) => acc && this.validateQuestion(question), true);
    }
}
