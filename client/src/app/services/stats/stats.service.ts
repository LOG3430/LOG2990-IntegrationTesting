import { Injectable } from '@angular/core';
import { GameLogicService } from '@app/services/game-logic/game-logic.service';
import { GameService } from '@app/services/game/game.service';
import { SocketService } from '@app/services/socket/socket.service';
import { enumValues } from '@app/utils/enum-values';
import { Swipe } from '@common/constants';
import {
    BarChartEvent,
    ChoiceVote,
    GameEvent,
    GameQuestion,
    GameResults,
    GradeCategory,
    GradeCount,
    InteractionStatus,
    SubmitInfos,
} from '@common/events';
import { QTypes } from '@common/question-type';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class StatsService {
    questionName: string = this.gameLogic.getCurrentQuestion().text;
    questionType: QTypes = this.gameLogic.getCurrentQuestion().type;
    private finalGradeCount: GradeCount[] = [];
    private gradeCount: GradeCount;
    private inputChoice: ChoiceVote[] = [];
    private resultIndex: number = 0;
    private isShowingAnswers: boolean = false;
    private hasInteracted: number = 0;
    private hasNotInteracted: number = 0;

    private howManySubmitted: number = 0;

    private chartSubject: Subject<void> = new Subject();

    constructor(
        private gameService: GameService,
        private gameLogic: GameLogicService,
        private socket: SocketService,
    ) {
        this.configureSocket();
        this.hasNotInteracted = this.gameService.getPlayers() ? this.gameService.getPlayers().length : 0;
        this.emptyGradeCounts();
    }

    setQuestionName(question: GameQuestion): void {
        if (question) this.questionName = `${question.text} (${question.points})`;
    }

    setQuestionType(question: GameQuestion): void {
        if (question) this.questionType = question.type;
    }

    getQuestionChoices(): string[] {
        return this.inputChoice.map((c) => c.name);
    }

    getGradeCategories(): string[] {
        if (this.isShowingAnswers || this.isGameOver()) {
            return ['0', '50', '100'];
        } else {
            return ['a  modifié', "n'a pas modifié"];
        }
    }

    getPlayersAlive(): string[] {
        return this.gameService.getPlayers();
    }

    getSelectedChoices(): ChoiceVote[] {
        return this.inputChoice;
    }

    getQuestionIndex(): number {
        return this.resultIndex;
    }

    getGameResults(): GameResults {
        return this.gameService.getGameResults() ?? { question: [], votes: [], gradeCounts: [] };
    }

    getGradeCounts(): GradeCount {
        return this.gradeCount;
    }

    getFinalGradeCount(): GradeCount[] {
        return this.finalGradeCount;
    }

    getLAQData(): number[] {
        if (this.isGameOver() && this.getFinalGradeCount()[this.getQuestionIndex()]) {
            return this.getValues(this.getFinalGradeCount()[this.getQuestionIndex()]);
        } else {
            return this.getLAQDataQuestion();
        }
    }

    isGameOver(): boolean {
        return this.gameService.isGameOver();
    }

    slideChart(swipe: Swipe) {
        const gameResults = this.getGameResults();
        if (this.isGameOver() && gameResults.votes) {
            this.resultIndex = (swipe + this.resultIndex + gameResults.votes.length) % gameResults.votes.length;
            this.updateGameResultChart();
        }
    }

    listenToSelectChoice() {
        this.socket.on(BarChartEvent.SendSelectedList, (votes: ChoiceVote[]) => {
            this.inputChoice = votes;
            this.chartSubject.next();
        });
    }

    listenToInteraction() {
        this.socket.on(BarChartEvent.SendInteracted, (interaction: InteractionStatus) => {
            this.hasInteracted = interaction.interacted;
            this.hasNotInteracted = interaction.notInteracted;
            this.chartSubject.next();
        });
    }

    getHowManySubmitted(): number {
        return this.howManySubmitted;
    }

    onChartUpdate(): Observable<void> {
        return this.chartSubject;
    }

    listenToIsAnswering() {
        this.socket.on(GameEvent.IsAnswering, () => {
            this.isShowingAnswers = false;
            this.chartSubject.next();
        });
    }

    listenToIsShowingAnswers() {
        this.socket.on(GameEvent.IsShowingAnswers, () => {
            this.isShowingAnswers = true;
            this.chartSubject.next();
        });
    }

    listenToSendGrades() {
        this.socket.on(BarChartEvent.SendGrades, (grades: GradeCount) => {
            this.gradeCount = grades;
            this.chartSubject.next();
        });
    }

    getGameCompletion(): number {
        return (this.gameLogic.getCurrentQuestion().index + 1) / this.gameService.getGameInfo().numberOfQuestions;
    }

    updateGameResultChart(): void {
        if (!this.isGameOver()) {
            return;
        }

        const gameResults = this.getGameResults();
        this.setQuestionName(gameResults.question[this.resultIndex]);
        this.setQuestionType(gameResults.question[this.resultIndex]);
        if (gameResults.votes) this.inputChoice = gameResults.votes[this.resultIndex];
        if (gameResults.gradeCounts) this.finalGradeCount = gameResults.gradeCounts;
        this.chartSubject.next();
    }

    private getLAQDataQuestion(): number[] {
        if (this.isShowingAnswers) {
            return this.getValues(this.getGradeCounts());
        } else {
            return [this.hasInteracted, this.hasNotInteracted];
        }
    }

    private getValues = (g: GradeCount) => {
        return enumValues(GradeCategory).map((key) => g[key]);
    };

    private listenToGameOver() {
        this.gameService.onGameOver().subscribe(() => this.updateGameResultChart());
    }

    private emptyGradeCounts(): void {
        this.gradeCount = {
            [GradeCategory.Zero]: 0,
            [GradeCategory.Fifty]: 0,
            [GradeCategory.Hundred]: 0,
        };
    }

    private listenToNewQuestion() {
        this.gameLogic.onNewQuestion().subscribe(() => {
            this.inputChoice = [];
            this.howManySubmitted = 0;
            this.emptyGradeCounts();
            this.setQuestionType(this.gameLogic.getCurrentQuestion());
            this.setQuestionName(this.gameLogic.getCurrentQuestion());
            this.chartSubject.next();
        });
    }

    private configureSocket() {
        this.listenToNewQuestion();
        this.listenToGameOver();
        this.listenToInteraction();
        this.listenToIsAnswering();
        this.listenToIsShowingAnswers();
        this.listenToSelectChoice();
        this.listenToSendGrades();

        this.socket.on(BarChartEvent.SendSubmitList, (infos: SubmitInfos) => {
            this.howManySubmitted = infos.howManySubmitted;
        });

        this.socket.on(BarChartEvent.SendFinalGrades, (grades: GradeCount[]) => {
            this.finalGradeCount = grades;
        });
    }
}
