import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { PANIC_QCM_CUTOFF, SECOND } from '@common/constants';
import { BarChartEvent, GameEvent, GameQuestion, Interaction, JoinResponse, OrganiserEvent, QuestionResults, SelectedChoice } from '@common/events';
import { QTypes } from '@common/question-type';
import { Observable, Subject } from 'rxjs';

export enum PlayState {
    Answering,
    Submitted,
    WaitingEvaluation,
    ShowingAnswers,
}

@Injectable({
    providedIn: 'root',
})
export class GameLogicService {
    joinResponse: JoinResponse = { totalNumberOfQuestions: 0, success: false, title: ' ' };

    private playState: PlayState = PlayState.Answering;

    private question: GameQuestion;
    private userScore: number = 0;
    private time: number = 0;

    private paused: boolean = false;
    private panicMode: boolean = false;

    private results: Subject<QuestionResults> = new Subject();
    private nextQuestionSubject: Subject<void> = new Subject();
    private gameOverSubject: Subject<void> = new Subject();

    constructor(private socketService: SocketService) {
        this.socketService.connect();
        this.configureSocket();
    }

    submit(answer: number[] | string): void {
        this.playState = PlayState.Submitted;
        this.socketService.send(this.getType() === QTypes.MCQ ? GameEvent.SubmitMCQ : GameEvent.SubmitLAQ, answer);
    }

    sendInteraction(interaction: Interaction): void {
        this.socketService.send(BarChartEvent.SendInteracted, interaction);
    }

    select(choice: SelectedChoice): void {
        this.socketService.send(BarChartEvent.SendSelected, choice);
    }

    getType(): QTypes {
        return this.getCurrentQuestion().type;
    }

    getTime(): number {
        return this.time;
    }

    getUserScore(): number {
        return this.userScore;
    }

    getCurrentQuestion(): GameQuestion {
        return this.question;
    }

    onReceiveResults(): Observable<QuestionResults> {
        return this.results;
    }

    onNewQuestion(): Observable<void> {
        return this.nextQuestionSubject;
    }

    onGameOver(): Observable<void> {
        return this.gameOverSubject;
    }

    pause(): void {
        this.socketService.send(OrganiserEvent.Pause, undefined, (isPaused: boolean) => {
            this.paused = isPaused;
        });
    }

    isPaused(): boolean {
        return this.paused;
    }

    goPanic(): void {
        this.socketService.send(OrganiserEvent.GoPanic);
    }

    isPanicking(): boolean {
        return this.panicMode;
    }

    canPanic(): boolean {
        return this.time >= PANIC_QCM_CUTOFF && !this.panicMode;
    }

    getState(): PlayState {
        return this.playState;
    }

    private configureSocket() {
        this.listenToTick();
        this.listenToQuestions();
        this.listenToQuestionResults();
        this.listenToIsShowingAnswers();
        this.listenToQuestionEvaluation();
        this.listenToGameover();
        this.listenToPanic();
    }

    private listenToTick() {
        this.socketService.on(GameEvent.Tick, (timeRemaining: number) => {
            this.time = Math.round(timeRemaining / SECOND);
        });
    }

    private listenToQuestions() {
        this.socketService.on(GameEvent.NewQuestion, (q: GameQuestion) => {
            this.playState = PlayState.Answering;
            this.question = q;
            this.nextQuestionSubject.next();
        });
    }

    private listenToIsShowingAnswers() {
        this.socketService.on(GameEvent.IsShowingAnswers, () => {
            this.playState = PlayState.ShowingAnswers;
            this.paused = false;
            this.panicMode = false;
        });
    }

    private listenToQuestionResults() {
        this.socketService.on(GameEvent.QuestionResults, (res: QuestionResults) => {
            this.results.next(res);
            this.userScore += res.points;
        });
    }

    private listenToQuestionEvaluation() {
        this.socketService.on(GameEvent.QuestionEvaluation, () => {
            this.playState = PlayState.WaitingEvaluation;
        });
    }

    private listenToGameover() {
        this.socketService.on(GameEvent.Gameover, () => {
            this.gameOverSubject.next();
        });
    }

    private listenToPanic() {
        this.socketService.on(GameEvent.Panicking, () => {
            this.panicMode = true;
            this.playSound();
        });
    }

    private playSound() {
        const audio = new Audio();
        audio.src = './assets/vineboom.mp3';
        audio.load();
        audio.play();
    }
}
