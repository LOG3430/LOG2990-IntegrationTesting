import { Factory } from '@app/classes/game-states/factory/factory';
import { GameStateBase } from '@app/classes/game-states/game-state-base/game-state-base';
import { Game, GameState } from '@app/classes/game/game';
import { GradeManager } from '@app/classes/grade-manager/grade-manager';
import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { VoteList } from '@app/classes/vote-list/vote-list';
import { getDateString } from '@app/utils/date';
import { LAQ_DURATION, SECOND, SHOW_ANSWERS_DELAY } from '@common/constants';
import {
    BarChartEvent,
    GameEvent,
    GameQuestion,
    GameResults,
    Grade,
    GradeCount,
    Interaction,
    InteractionStatus,
    JoinResponse,
    Leaderboard,
    LeaderboardEntry,
    PlayerState,
    SelectedChoice,
    SubmitInfos,
} from '@common/events';
import { History } from '@common/history';
import { QTypes } from '@common/question-type';
import { Quiz } from '@common/quiz';
import { Subject } from 'rxjs';
import { Socket } from 'socket.io';

export type EventData = [GameEvent, GameQuestion | number | undefined];

export class GameRoom {
    game: Game;
    startTime: string = '';
    private gradeManager: GradeManager = new GradeManager();
    private state: GameStateBase;
    private gameOverSubject: Subject<History> = new Subject();
    private leavers: Player[] = [];
    private finalLeaderboard: LeaderboardEntry[];
    private submittedVotes: VoteList[] = [];

    constructor(
        quiz: Quiz,
        public room: Room<Player>,
        private factory: Factory,
    ) {
        this.game = new Game(quiz);
        this.switchTo(GameState.Joining);
    }

    join(socket: Socket, username: string): JoinResponse {
        return {
            ...this.room.join(socket, username),
            totalNumberOfQuestions: this.game.nQuestions(),
            title: this.game.getTitle(),
        };
    }

    leave(socket: Socket): void {
        const player = this.getPlayer(socket);
        this.room.leave(socket);

        if (player && this.isPlaying()) {
            player.state = PlayerState.Left;
            this.leavers.push(player);
            this.room.toOrganiser(Leaderboard.send, this.getLeaderboard());
        }
    }

    startGame(socket: Socket): void {
        if (this.canStart(socket)) {
            this.onStart();
            this.setStartDelay();
        }
    }

    verifyMCQ(socket: Socket, answers: number[]): void {
        this.playerSubmit(socket, (p) => p.answerMcq(answers));
    }

    verifyLAQ(socket: Socket, answers: string): void {
        this.playerSubmit(socket, (p) => p.answerLaq(answers));
    }

    ready(socket: Socket): void {
        if (this.canReady(socket)) {
            this.readyInDelay();
        }
    }

    kill(): void {
        this.game.state = GameState.Over;
        this.clearInterval();
    }

    update(): void {
        const nextState = this.nextState();
        if (this.game.state !== nextState) {
            this.switchTo(nextState);
        } else if (this.isInTickingState()) {
            this.tick();
        }
    }

    allPlayersAnswered(): boolean {
        return this.getPlayers().reduce((acc, p) => acc && !!p.infos, true);
    }

    isTimerDone(): boolean {
        return this.game.timer.isDone();
    }

    tick(): void {
        this.room.toAll(GameEvent.Tick, this.game.timer.remaining());
    }

    startRound(): void {
        this.launchCountdown(this.getDuration());
        this.game.isReadyForNextQuestion = false;
        this.gradeManager.startRound();
        this.getPlayers().forEach((p: Player) => p.startRound());
    }

    getCurrentQuestion() {
        return this.game.getCurrentQuestion();
    }

    getGameQuestion(): GameQuestion {
        return this.game.getGameQuestion();
    }

    clearInterval() {
        this.game.timer.pause();
    }

    launchCountdown(time: number) {
        this.game.timer.stopPanicking();
        this.game.timer.startCountdown(time);
        this.game.timer.onTick(() => {
            this.update();
            if (this.game.timer.isDone()) {
                this.game.timer.pause();
            }
        });
    }

    receivedStart(): boolean {
        return this.game.receivedStart;
    }

    goToNextQuestion() {
        this.game.goToNextQuestion();
    }

    hasNextQuestion(): boolean {
        return this.game.hasNextQuestion;
    }

    readyForNextQuestion(): boolean {
        return this.game.isReadyForNextQuestion;
    }

    isFirstToAnswer(player: Player): boolean {
        if (!this.isInTimedout(player)) {
            return this.getPlayers().every((p) => p.infos.time > player.infos.time + SECOND || p === player);
        }
    }

    onGameOver(): Subject<History> {
        return this.gameOverSubject;
    }

    emitGameOver(history: History) {
        this.gameOverSubject.next(history);
    }

    getPlayers(): Player[] {
        return this.room.getMembers();
    }

    getGrade(player: Player): number {
        return this.gradeManager.getGrades().find((g) => g.username === player.username)?.grade;
    }

    goToLAQResults(socket: Socket, gradesFromOrganiser: Grade[]): void {
        this.gradeManager.grade(gradesFromOrganiser);
        this.ready(socket);
        this.update();
    }

    getPlayerByName(username: string): Player | undefined {
        return this.getPlayers().find((p) => p.username === username);
    }

    getSelectedVotes(): VoteList {
        return this.getPlayers().reduce((votes, p) => {
            p.selected.forEach((i) => (votes.getVotes()[i].votes += 1));
            return votes;
        }, new VoteList(this.getCurrentQuestion()));
    }

    getGameResults(): GameResults {
        return {
            question: this.game.quiz.questions.map((q, i) => this.game.toGameQuestion(q, i)),
            votes: this.submittedVotes.map((v) => v.getVotes()),
            gradeCounts: this.gradeManager.getGradeCountsList(),
        };
    }

    setFinalLeaderboard() {
        this.finalLeaderboard = this.getLeaderboard();
    }

    getLeaderboard(): LeaderboardEntry[] {
        return this.finalLeaderboard ?? [...this.getPlayers(), ...this.leavers].map((player) => player.getScore());
    }

    setTimerTimedout(timerTimedout: number | null) {
        this.game.timerTimedout = timerTimedout;
    }

    isInTimedout(player: Player): boolean {
        return this.game.timerTimedout && player.infos.time >= this.game.timerTimedout;
    }

    selectChoice(socket: Socket, selectedChoice: SelectedChoice) {
        const player = this.getPlayer(socket);
        if (player && this.getGameQuestion().index === selectedChoice.questionIndex) {
            player.selectAnswer(selectedChoice);
            this.room.toOrganiser(Leaderboard.send, this.getLeaderboard());
        }
    }

    updateInteraction(socket: Socket, interaction: Interaction) {
        const player = this.getPlayer(socket);
        if (player) {
            player.interactLaq(interaction);
            this.room.toOrganiser(BarChartEvent.SendInteracted, this.getInteractions());
            this.room.toOrganiser(Leaderboard.send, this.getLeaderboard());
        }
    }

    isPlaying(): boolean {
        return !this.isInState(GameState.Joining) && !this.isInState(GameState.Over) && !this.finalLeaderboard;
    }

    pauseTimer(): boolean {
        return this.game.timer.togglePause();
    }

    panicTimer() {
        this.game.timer.panic();
        this.room.toAll(GameEvent.Panicking);
    }

    pushSubmittedVotes(votes: VoteList) {
        this.submittedVotes.push(votes);
        this.gradeManager.pushGrades();
    }

    getGradeCounts(): GradeCount {
        return this.gradeManager.getGradeCounts();
    }

    isGraded(): boolean {
        return this.gradeManager.isGraded();
    }

    protected readyInDelay() {
        this.launchCountdown(SHOW_ANSWERS_DELAY);
        this.tick();
        setTimeout(() => {
            if (this.isInState(GameState.ShowingAnswers)) {
                this.game.isReadyForNextQuestion = true;
                this.update();
            }
        }, SHOW_ANSWERS_DELAY);
    }

    protected getPlayer(socket: Socket): Player {
        return this.room.getMember(socket);
    }

    protected canStart(socket: Socket) {
        return !this.game.receivedStart && this.room.isOrganiser(socket) && !this.room.isUnlocked() && this.getPlayers().length > 0;
    }

    protected setStartDelay() {
        this.switchTo(GameState.Presentation);
    }

    protected onStart() {
        this.game.receivedStart = true;
        this.startTime = getDateString();
    }

    private isInTickingState(): boolean {
        return this.isInState(GameState.Answering) || this.isInState(GameState.ShowingAnswers);
    }

    private isInVerifyState() {
        return this.isInState(GameState.Answering);
    }

    private nextState(): GameState {
        return this.state.nextState();
    }

    private isInState(state: GameState): boolean {
        return this.game.state === state;
    }

    private switchTo(state: GameState) {
        (this.state = new (this.factory.getState((this.game.state = state)))(this)).onInit();
    }

    private getSubmitInfo(): SubmitInfos {
        return { howManySubmitted: this.getPlayers().reduce((acc, player) => acc + (player.infos ? 1 : 0), 0) };
    }

    private canReady(socket: Socket): boolean {
        return this.isInState(GameState.ShowingAnswers) && this.room.isOrganiser(socket);
    }

    private getInteractions(): InteractionStatus {
        const nInteracted = this.getPlayers().filter((player) => player.hasInteracted === true).length;
        return { interacted: nInteracted, notInteracted: this.getPlayers().length - nInteracted };
    }

    private onPlayerSubmit(): void {
        this.room.toOrganiser(BarChartEvent.SendSubmitList, this.getSubmitInfo());
        this.room.toOrganiser(Leaderboard.send, this.getLeaderboard());
        this.update();
    }

    private playerSubmit(socket: Socket, onSuccess: (p: Player) => void) {
        const player = this.getPlayer(socket);
        if (player && this.isInVerifyState()) {
            onSuccess(player);
            this.onPlayerSubmit();
        }
    }

    private getDuration(): number {
        return this.getCurrentQuestion().type === QTypes.MCQ ? this.game.quiz.duration * SECOND : LAQ_DURATION;
    }
}
