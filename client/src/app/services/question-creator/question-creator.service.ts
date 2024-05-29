import { Injectable } from '@angular/core';
import { QuestionValidatorService } from '@app/services/question-validation/question-validator.service';
import { Choice } from '@common/choice';
import { QuestionConstants } from '@common/constants';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';

@Injectable({
    providedIn: 'root',
})
export class QuestionCreatorService {
    private question: Question;

    constructor(private questionValidatorService: QuestionValidatorService) {}

    getQuestion(): Question {
        return this.question;
    }

    getChoices(): Choice[] {
        return this.question.choices ?? [];
    }

    initEmptyChoice(): Choice {
        return { text: '', isCorrect: false };
    }

    initEmptyChoices(): Choice[] {
        return [this.initEmptyChoice(), this.initEmptyChoice()];
    }

    addChoice(): boolean {
        if (this.question.choices && this.getChoices().length < QuestionConstants.MAX_CHOICES) {
            this.question.choices.push(this.initEmptyChoice());
            return true;
        }
        return false;
    }

    deleteChoice(index: number): void {
        if (this.question.choices && this.getChoices().length > QuestionConstants.MIN_CHOICES) {
            this.question.choices.splice(index - 1, 1);
        }
    }

    onSelected(value: string): void {
        this.question.points = parseInt(value, 10);
    }

    isValidChoice(index: number): boolean {
        if (!this.question.choices) return false;
        else {
            return this.question.choices[index].isCorrect;
        }
    }

    isValidQuestion(question: Question): boolean {
        return this.questionValidatorService.isValid(question);
    }

    onClickValidity(index: number): void {
        if (this.question.choices) {
            this.question.choices[index].isCorrect = !this.question.choices[index].isCorrect;
        }
    }

    setTypeQuestion(): void {
        this.question.type = this.question.type === QTypes.MCQ ? QTypes.LAQ : QTypes.MCQ;
        this.question.choices = this.question.type === QTypes.MCQ ? this.initEmptyChoices() : undefined;
    }

    init(data?: Question) {
        if (!data) this.initQuestion();
        else {
            this.question = JSON.parse(JSON.stringify(data));
        }
    }

    private initQuestion() {
        this.question = {
            id: ' ',
            lastModif: '',
            text: '',
            points: 10,
            choices: this.initEmptyChoices(),
            type: QTypes.MCQ,
        };
    }
}
