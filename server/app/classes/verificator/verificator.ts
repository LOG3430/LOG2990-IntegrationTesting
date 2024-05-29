import { Choice } from '@common/choice';
import { ONE_HUNDRED, SCORE_BONUS } from '@common/constants';
import { QuestionResults } from '@common/events';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';

export class Verificator {
    static verifyMCQ(question: Question, answer: number[], isFirstToAnswer: boolean): QuestionResults {
        const allCorrect = Verificator.allCorrect(question, answer);
        return Verificator.makeResults(question, allCorrect ? question.points : 0, isFirstToAnswer && allCorrect);
    }

    static verifyLAQ(question: Question, grade: number): QuestionResults {
        return Verificator.makeResults(question, (question.points * grade) / ONE_HUNDRED, false);
    }

    private static allCorrect(question: Question, answer: number[]): boolean {
        return question.choices.every((c: Choice, i: number) => (c.isCorrect ? answer.includes(i) : !answer.includes(i)));
    }

    private static goodAnswers(question: Question): string[] {
        return question.choices.filter((c) => c.isCorrect).map((c) => c.text);
    }

    private static makeResults(question: Question, basePoints: number, hasBonus: boolean): QuestionResults {
        if (question.type === QTypes.MCQ) {
            return {
                hasBonus,
                points: basePoints * (hasBonus ? SCORE_BONUS : 1.0),
                goodAnswers: Verificator.goodAnswers(question),
            };
        } else {
            return {
                hasBonus,
                points: basePoints,
            };
        }
    }
}
