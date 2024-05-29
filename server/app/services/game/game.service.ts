import { GameRoom } from '@app/classes/game-room/game-room';
import { Factory, gameStateTable } from '@app/classes/game-states/factory/factory';
import { Player } from '@app/classes/player/player';
import { RandomRoom } from '@app/classes/random-room/random-room/random-room';
import { Room } from '@app/classes/room/room';
import { TestRoom } from '@app/classes/test-room/test-room';
import { HistoryService } from '@app/services/history/history.service';
import { QuestionService } from '@app/services/question/question.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { GAME_ROOM_ID_LEN, GAME_ROOM_ID_MAX_DIGIT, RANDOM_MODE_DURATION, ROOM_DEATH_TIMEOUT_DELAY, SYSTEM_NAME } from '@common/constants';
import { CreateRequest, CreateResponse, GameEvent, GameType, JoinResponse, LeaveReason, PlayerInfos } from '@common/events';
import { Message } from '@common/message';
import { QTypes } from '@common/question-type';
import { Quiz } from '@common/quiz';
import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { ChatService } from '@app/services/chat/chat.service';

type GameConstructor = new (q: Quiz, room: Room<Player>, factory: Factory) => GameRoom;

export interface SystemMessage {
    room: Room<Player>;
    message: Message;
}

@Injectable()
export class GameService {
    private rooms = new Map<string, GameRoom>();
    private players = new Map<string, string>();

    private systemMessageSubject: Subject<SystemMessage> = new Subject();

    constructor(
        private quizService: QuizService,
        private questionService: QuestionService,
        private historyService: HistoryService,
    ) {}

    async createGameRoom(request: CreateRequest, server: Server): Promise<CreateResponse> {
        return this.createRoom(this.dispatchGameType(request.type), server, request);
    }

    join(socket: Socket, playerInfos: PlayerInfos, server: Server): JoinResponse {
        if (!this.roomExists(playerInfos.roomId)) {
            return { success: false, error: `Aucune partie avec le code ${playerInfos.roomId}` };
        }

        if (this.playerExists(socket)) {
            return this.switchRoom(socket, playerInfos, server);
        }

        return this.joinRoom(socket, playerInfos);
    }

    leave(socket: Socket, reason: LeaveReason = LeaveReason.Voluntary) {
        const username = this.getPlayerName(socket);
        const gameroom = this.getGameRoom(socket);
        this.players.delete(socket.id);

        if (!gameroom) return;

        gameroom.room.toAll(GameEvent.PlayerLeaving, { username, reason });
        if (reason === LeaveReason.Voluntary && gameroom.isPlaying()) {
            this.sendSystemMessage(gameroom.room, `${username} a abandonné la partie`);
        }

        this.leaveRoom(socket, gameroom);
    }

    verifyMCQ(socket: Socket, answer: number[]) {
        this.getGameRoom(socket)?.verifyMCQ(socket, answer);
    }

    verifyLAQ(socket: Socket, answer: string) {
        this.getGameRoom(socket)?.verifyLAQ(socket, answer);
    }

    getGameRoom(socket: Socket): GameRoom | undefined {
        return this.players.get(socket.id) ? this.rooms.get(this.players.get(socket.id)) : undefined;
    }

    roomExists(roomId: string): boolean {
        return this.rooms.has(roomId);
    }

    getPlayer(username: string): Player | undefined {
        let player: Player | undefined;
        this.rooms.forEach((room) => {
            if (!player) {
                player = room.room.getMembers().find((p) => p.username === username);
            }
        });
        return player;
    }

    getPlayerName(socket: Socket): string | undefined {
        return this.getGameRoom(socket)?.room.getAnyone(socket)?.username;
    }

    onSystemMessage(): Observable<SystemMessage> {
        return this.systemMessageSubject;
    }

    sendSystemMessage(room: Room<Player>, content: string) {
        this.systemMessageSubject.next({ room, message: ChatService.formatMessage(SYSTEM_NAME, content) });
    }

    private destroyRoom(roomId: string) {
        this.rooms.get(roomId).kill();
        this.rooms.delete(roomId);
        this.players.forEach((room, player) => {
            if (room === roomId) {
                this.players.delete(player);
            }
        });
    }

    private playerExists(socket: Socket): boolean {
        return this.players.has(socket.id);
    }

    private dispatchGameType(type: GameType): GameConstructor {
        switch (type) {
            case GameType.Normal:
                return GameRoom;
            case GameType.Test:
                return TestRoom;
            case GameType.Aleatoire:
                return RandomRoom;
        }
    }

    private async createRoom(constructor: GameConstructor, server: Server, request: CreateRequest): Promise<CreateResponse> {
        const [err, quiz] = await this.getQuiz(request);
        if (err) return err;
        const roomId = this.generateGameId();
        const gameRoom = new constructor(quiz, new Room<Player>(roomId, server, Player), new Factory(gameStateTable));
        this.rooms.set(roomId, gameRoom);
        this.setDeathTimeout(roomId);
        if (constructor !== TestRoom) {
            const sub = gameRoom.onGameOver().subscribe((playedGame) => {
                this.historyService.add(playedGame);
                sub.unsubscribe();
            });
        }
        return { success: true, roomId };
    }

    private async getQuiz(request: CreateRequest): Promise<[CreateResponse | null, Quiz | null]> {
        let err: CreateResponse;
        let quiz: Quiz;
        if (request.quizId) {
            [err, quiz] = await this.getNormalQuiz(request.quizId);
            if (err) return [err, null];
        } else if (request.length) {
            [err, quiz] = await this.getRandomQuiz(request.length);
            if (err) return [err, null];
        } else return [{ success: false, error: "La salle n'a pas pu être créée" }, null];
        return [null, quiz];
    }

    private async getNormalQuiz(quizId: string): Promise<[CreateResponse | undefined, Quiz | undefined]> {
        const quiz = await this.quizService.findOne(quizId);
        if (!quiz) {
            return [{ success: false, error: 'Le jeu a été supprimé' }, undefined];
        }
        if (!quiz.visibility) {
            return [{ success: false, error: 'Le jeu a été caché' }, undefined];
        }
        return [undefined, quiz];
    }

    private async getRandomQuiz(length: number): Promise<[CreateResponse | undefined, Quiz]> {
        if ((await this.questionService.countDocuments(QTypes.MCQ)) < length) {
            return [{ success: false, error: "Il n'y a pas assez de questions disponibles" }, undefined];
        }
        return [
            undefined,
            {
                title: 'Mode aléatoire',
                questions: await this.questionService.findMultiple(length, QTypes.MCQ),
                duration: RANDOM_MODE_DURATION,
            } as Quiz,
        ];
    }

    private generateGameId(): string {
        let roomId: string;
        do {
            roomId = Array.from({ length: GAME_ROOM_ID_LEN }, () => this.genDigit()).join('');
        } while (this.roomExists(roomId));
        return roomId;
    }

    private genDigit(): string {
        return Math.floor(Math.random() * GAME_ROOM_ID_MAX_DIGIT).toFixed(0);
    }

    private joinRoom(socket: Socket, playerInfos: PlayerInfos): JoinResponse {
        const joinResponse = this.rooms.get(playerInfos.roomId)?.join(socket, playerInfos.username) ?? { success: false };

        if (joinResponse.success) {
            this.players.set(socket.id, playerInfos.roomId);
            socket.to(playerInfos.roomId).emit(GameEvent.NewPlayer, playerInfos.username);
        }

        return joinResponse;
    }

    private leaveRoom(socket: Socket, gameroom: GameRoom) {
        gameroom.leave(socket);

        if (gameroom.room.isEmpty()) {
            this.destroyRoom(gameroom.room.getId());
        }
    }

    private switchRoom(socket: Socket, playerInfos: PlayerInfos, server: Server): JoinResponse {
        const playerRoom = this.getGameRoom(socket);
        if (playerRoom.room.getId() === playerInfos.roomId) {
            return playerRoom.join(socket, playerInfos.username);
        }

        this.leave(socket);
        return this.join(socket, playerInfos, server);
    }

    private setDeathTimeout(roomId: string) {
        setTimeout(() => {
            if (this.rooms.get(roomId)?.room.isEmpty()) {
                this.destroyRoom(roomId);
            }
        }, ROOM_DEATH_TIMEOUT_DELAY);
    }
}
