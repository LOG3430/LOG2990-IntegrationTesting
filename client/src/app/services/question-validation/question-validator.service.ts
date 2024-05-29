import { Injectable } from '@angular/core';
import { Choice } from '@common/choice';
import { QuestionConstants } from '@common/constants';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';

@Injectable({
    providedIn: 'root',
})
export class QuestionValidatorService {
    isValid(question: Question): boolean {
        if (question.type === QTypes.MCQ) {
            return this.hasText(question) && this.areValidChoices(question);
        } else if (question.type === QTypes.LAQ) {
            return this.hasText(question) && this.isChoicesAvailable(question);
        }
        return false;
    }

    hasText(questionVerify: Question): boolean {
        return questionVerify.text.trim().length !== 0 && this.isTextMaxLength(questionVerify);
    }

    areValidChoices(question: Question): boolean {
        this.convertChoices(question);
        return this.hasGood(question) && this.hasWrong(question) && this.noWhitespaceChoice(question);
    }

    convertChoices(question: Question): void {
        question.choices?.forEach((choice: Choice) => (choice.isCorrect = !!choice.isCorrect));
    }

    hasWrong(questionVerify: Question): boolean {
        return questionVerify.choices?.some((choice: Choice) => !choice.isCorrect) ?? false;
    }

    hasGood(questionVerify: Question): boolean {
        return questionVerify.choices?.some((choice: Choice) => choice.isCorrect) ?? false;
    }

    noWhitespaceChoice(questionVerify: Question): boolean {
        return questionVerify.choices?.every((choice: Choice) => !!choice.text.trim().length) ?? false;
    }

    isChoicesAvailable(questionVerify: Question): boolean {
        return !questionVerify.choices;
    }

    isTextMaxLength(questionVerify: Question): boolean {
        return questionVerify.text.length <= QuestionConstants.MAX_ANSWER_LENGTH;
    }
}
