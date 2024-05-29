import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GlobalService } from '@app/services/global/global.service';
import { SocketService } from '@app/services/socket/socket.service';
import { ORGANISER_NAME } from '@common/constants';
import {
    CreateRequest,
    CreateResponse,
    GameEvent,
    GameResults,
    GameType,
    JoinResponse,
    LeaderboardEntry,
    Leaderboard as LeaderboardEvent,
    LeaveDescription,
    LeaveReason,
    OrganiserEvent,
    PlayerInfos,
    UserAnswer,
} from '@common/events';
import { Quiz } from '@common/quiz';
import { Observable, Subject, catchError, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface GameInfo {
    title: string;
    numberOfQuestions: number;
}

export enum State {
    Wait = 'wait',
    Present = 'present',
    Play = 'play',
    Result = 'result',
    Evaluation = 'evaluation',
}

@Injectable({
    providedIn: 'root',
})
export class GameService {
    gameMode: GameType | undefined;

    private readonly baseUrl: string = environment.serverUrl;

    private gameResults: GameResults | null;
    private state: State = State.Wait;

    private joinResponse: JoinResponse = { success: false };

    private playerInfos: PlayerInfos = { roomId: '', username: 'Inconnu' };
    private players: string[] = [];
    private answersToEvaluate: UserAnswer[] = [];

    private leaderboardSubject: Subject<LeaderboardEntry[]> = new Subject();

    private gameOverSubject: Subject<void> = new Subject();

    constructor(
        private socketService: SocketService,
        private readonly http: HttpClient,
        private global: GlobalService,
    ) {
        this.socketService.connect();
        this.configureSocket();
    }

    getState(): State {
        return this.state;
    }

    getPlayers(): string[] {
        return this.players;
    }

    getJoinResponse(): JoinResponse {
        return this.joinResponse;
    }

    getMyName(): string {
        return this.playerInfos.username;
    }

    gameCode(): string {
        return this.playerInfos.roomId;
    }

    isOrganiser(): boolean {
        return this.isMe(ORGANISER_NAME);
    }

    isMe(username: string) {
        return username === this.getMyName();
    }

    createGame(game: Quiz): Observable<CreateResponse> {
        return this.createGameRoom({ quizId: game.id, type: GameType.Normal });
    }

    testGame(game: Quiz): Observable<CreateResponse> {
        return this.createGameRoom({ quizId: game.id, type: GameType.Test });
    }

    playRandomGame(length: number): Observable<CreateResponse> {
        return this.createGameRoom({ length, type: GameType.Aleatoire });
    }

    checkRoomExists(idRoom: string): Observable<boolean> {
        return this.http.get(this.baseUrl + '/' + idRoom).pipe(
            map(() => true),
            catchError(() => of(false)),
        );
    }

    join(playerInfos: PlayerInfos, callback: (success: boolean) => void) {
        this.socketService.send(GameEvent.Join, playerInfos, (response: JoinResponse) => {
            if (!response.success) {
                this.global.dialog.alert(response.error ?? 'Impossible de se connecter');
            }
            this.gameMode = response.type;
            this.setupNewGame(playerInfos.roomId, playerInfos.username);
            this.joinResponse = response;
            this.players = response.members ?? [];
            callback(response.success);
        });
    }

    leave() {
        this.socketService.send(GameEvent.Leave);
    }

    getGameInfo(): GameInfo {
        return {
            title: this.joinResponse.title ?? 'Jeu sans titre',
            numberOfQuestions: this.joinResponse.totalNumberOfQuestions ?? 0,
        };
    }

    isGameOver(): boolean {
        return !!this.gameResults;
    }

    getGameResults(): GameResults | null {
        return this.gameResults;
    }

    onLeaderboard(): Observable<LeaderboardEntry[]> {
        return this.leaderboardSubject;
    }

    onGameOver(): Observable<void> {
        return this.gameOverSubject;
    }

    getAnswersToEvaluate(): UserAnswer[] {
        return this.answersToEvaluate;
    }

    setState(state: State): void {
        this.state = state;
    }

    private createGameRoom(request: CreateRequest) {
        this.gameMode = request.type;
        return new Observable<CreateResponse>((subscriber) => {
            this.socketService.send(GameEvent.Create, request, (res: CreateResponse) => {
                subscriber.next(res);
                subscriber.unsubscribe();
                this.joinResponse = res.joinResponse ?? { success: false };
                this.setupNewGame(res.roomId, ORGANISER_NAME);
            });
        });
    }

    private configureSocket() {
        this.listenToNewPlayers();
        this.listenToPlayersLeaving();
        this.listenToPresentation();
        this.listenToPlay();
        this.listenToGameOver();
        this.listenToLeaderboard();
        this.listenToEvaluations();
    }

    private listenToEvaluations() {
        this.socketService.on(GameEvent.Evaluating, (laqList: UserAnswer[]) => {
            if (this.gameMode === GameType.Normal) {
                this.answersToEvaluate = laqList;
                this.state = State.Evaluation;
            } else {
                this.socketService.send(OrganiserEvent.sendResults, [{ username: 'Organisateur', grade: 100 }]);
            }
        });
    }

    private listenToNewPlayers() {
        this.socketService.on(GameEvent.NewPlayer, (name: string) => {
            this.playerJoin(name);
        });
    }

    private handleSelfLeaving(descr: LeaveDescription) {
        switch (descr.reason) {
            case LeaveReason.Voluntary:
                return;
            case LeaveReason.Banned:
                this.global.dialog.alert('Vous avez été banni');
                break;
            case LeaveReason.OrganiserLeft:
                this.global.dialog.alert("L'organisateur a quitté la partie");
                break;
            case LeaveReason.AllPlayersLeft:
                this.global.dialog.alert('Tous les joueurs ont quitté la partie');
                break;
        }

        this.global.router.navigate(['/home']);
    }

    private listenToPlayersLeaving() {
        this.socketService.on(GameEvent.PlayerLeaving, (descr: LeaveDescription) => {
            this.playerLeave(descr.username);

            if (this.isMe(descr.username)) {
                this.handleSelfLeaving(descr);
            }
        });
    }

    private listenToPresentation() {
        this.socketService.on(GameEvent.ShowPresentation, () => {
            this.state = State.Present;
        });
    }

    private listenToPlay() {
        this.socketService.on(GameEvent.NewQuestion, () => {
            this.state = State.Play;
        });
    }

    private listenToGameOver() {
        this.socketService.on(GameEvent.Gameover, (gameResults: GameResults) => {
            this.state = State.Result;
            this.gameResults = gameResults;
            this.gameOverSubject.next();
        });
    }

    private setupNewGame(roomId: string | undefined, username: string | undefined) {
        this.state = State.Wait;
        this.gameResults = null;
        this.players = [];
        this.playerInfos = {
            roomId: roomId ?? '',
            username: username ?? '',
        };
    }

    private listenToLeaderboard() {
        this.socketService.on(LeaderboardEvent.send, (leaderboard: LeaderboardEntry[]) => {
            this.leaderboardSubject.next(leaderboard);
        });
    }

    private playerJoin(username: string) {
        this.players.push(username);
    }

    private playerLeave(username: string) {
        this.players = this.players.filter((name: string) => name !== username);
    }
}
