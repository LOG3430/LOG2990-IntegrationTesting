import { Component, OnDestroy, OnInit } from '@angular/core';
import { GameLogicService, PlayState } from '@app/services/game-logic/game-logic.service';
import { GameService } from '@app/services/game/game.service';
import { INTERACTION_DELAY, QuestionConstants } from '@common/constants';
import { GameQuestion, QuestionResults } from '@common/events';
import { QTypes } from '@common/question-type';
import { Subscription } from 'rxjs';

export enum Key {
    One = '1',
    Two = '2',
    Three = '3',
    Four = '4',
    Enter = 'Enter',
}

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
})
export class PlayAreaComponent implements OnInit, OnDestroy {
    results: QuestionResults | null;

    selectedChoices: number[] = [];

    maxLengthAnswer: number = QuestionConstants.MAX_ANSWERS_LAQ_LENGTH;
    private lastInteraction: number = Date.now();

    private answerText: string = '';
    private resultSubscription: Subscription;
    private questionSubscription: Subscription;

    constructor(
        private gameService: GameService,
        private gameLogicService: GameLogicService,
    ) {}

    handleKeyDown(event: KeyboardEvent): void {
        if (this.isSubmitted()) {
            return;
        }

        switch (event.key) {
            case Key.One:
            case Key.Two:
            case Key.Three:
            case Key.Four:
                this.triggerAnswerClick(+event.key - 1);
                break;
            case Key.Enter:
                if (this.gameLogicService.getType() === QTypes.MCQ) this.submitAnswer();
                break;
        }
    }

    ngOnInit() {
        this.onReceiveResults();
        this.onNewQuestion();
    }

    ngOnDestroy(): void {
        this.resultSubscription?.unsubscribe();
        this.questionSubscription?.unsubscribe();
    }

    isOrganiser(): boolean {
        return this.gameService.isOrganiser();
    }

    triggerAnswerClick(index: number): void {
        this.toggle(index);
    }

    submitAnswer(): void {
        if (!this.canSubmit()) {
            return;
        }

        if (this.gameLogicService.getType() === QTypes.MCQ) {
            this.submitMcq();
        } else {
            this.submitLaq();
        }
    }

    toggle(answerIndex: number): void {
        if (this.isSubmitted()) return;

        const currentQuestion = this.getCurrentQuestion();
        if (currentQuestion.choices && answerIndex + 1 <= currentQuestion.choices.length) {
            this.updateChoices(answerIndex);
        }
    }

    getCurrentQuestion(): GameQuestion {
        return this.gameLogicService.getCurrentQuestion();
    }

    getUserScore(): number {
        return this.gameLogicService.getUserScore();
    }

    getCurrentQuestionIndex(): number {
        return this.getCurrentQuestion().index;
    }

    getNumberOfQuestions(): number {
        return this.gameService.getGameInfo().numberOfQuestions;
    }

    canSubmit(): boolean {
        return !this.isSubmitted() && (this.canSubmitMCQ() || this.canSubmitLAQ());
    }

    update(event: Event): void {
        if (!this.isSubmitted()) {
            this.answerText = (event.target as HTMLTextAreaElement).value;
            this.interact();
        }
    }

    isWaitingEvaluation(): boolean {
        return this.gameLogicService.getState() === PlayState.WaitingEvaluation;
    }

    isShowingAnswers(): boolean {
        return !!this.results && this.gameLogicService.getState() === PlayState.ShowingAnswers;
    }

    isSubmitted(): boolean {
        return this.gameLogicService.getState() !== PlayState.Answering;
    }

    private interact() {
        this.lastInteraction = Date.now();
        this.gameLogicService.sendInteraction({ isChanged: true, answerText: this.answerText });

        setTimeout(() => {
            if (Date.now() - this.lastInteraction >= INTERACTION_DELAY) {
                this.gameLogicService.sendInteraction({ isChanged: false, answerText: this.answerText });
            }
        }, INTERACTION_DELAY);
    }

    private canSubmitMCQ(): boolean {
        return this.gameLogicService.getType() === QTypes.MCQ && this.selectedChoices.length !== 0;
    }

    private canSubmitLAQ(): boolean {
        return this.gameLogicService.getType() === QTypes.LAQ && this.answerText.length !== 0;
    }

    private updateChoices(answerIndex: number): void {
        if (this.selectedChoices.includes(answerIndex)) {
            this.choicesAlreadySelected(answerIndex);
        } else {
            this.choicesNotSelected(answerIndex);
        }
    }

    private choicesAlreadySelected(answerIndex: number): void {
        this.selectedChoices.splice(this.selectedChoices.indexOf(answerIndex), 1);
        this.gameLogicService.select({ index: answerIndex, isSelected: false, questionIndex: this.getCurrentQuestion().index });
    }

    private choicesNotSelected(answerIndex: number): void {
        this.selectedChoices.push(answerIndex);
        this.gameLogicService.select({ index: answerIndex, isSelected: true, questionIndex: this.getCurrentQuestion().index });
    }

    private onNewQuestion(): void {
        this.questionSubscription = this.gameLogicService.onNewQuestion().subscribe(() => {
            this.results = null;
        });
    }

    private onReceiveResults(): void {
        this.resultSubscription = this.gameLogicService.onReceiveResults().subscribe((answer: QuestionResults) => {
            this.results = answer;
        });
    }

    private submitMcq(): void {
        this.gameLogicService.submit(this.selectedChoices);
        this.selectedChoices = [];
    }

    private submitLaq(): void {
        this.gameLogicService.submit(this.answerText);
        this.answerText = '';
    }
}
