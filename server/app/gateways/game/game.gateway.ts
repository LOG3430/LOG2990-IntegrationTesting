import { LoggingInterceptor } from '@app/interceptors/logging/logging.interceptor';
import { GameService } from '@app/services/game/game.service';
import { ORGANISER_NAME } from '@common/constants';
import { CreateRequest, CreateResponse, GameEvent, JoinResponse, PlayerInfos } from '@common/events';
import { Logger, UseInterceptors } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@UseInterceptors(LoggingInterceptor)
@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() private server: Server;

    constructor(
        private readonly logger: Logger,
        private gameService: GameService,
    ) {}

    @SubscribeMessage(GameEvent.Create)
    async create(socket: Socket, request: CreateRequest): Promise<CreateResponse> {
        const res = await this.gameService.createGameRoom(request, this.server);

        let joinResponse: JoinResponse;
        if (res.success && res.roomId) {
            joinResponse = this.join(socket, { roomId: res.roomId, username: ORGANISER_NAME });
        }

        return { ...res, joinResponse };
    }

    @SubscribeMessage(GameEvent.Join)
    join(socket: Socket, playerInfos: PlayerInfos): JoinResponse {
        return this.gameService.join(socket, playerInfos, this.server);
    }

    @SubscribeMessage(GameEvent.SubmitMCQ)
    verifyMCQ(socket: Socket, answer: number[]) {
        this.gameService.verifyMCQ(socket, answer);
    }

    @SubscribeMessage(GameEvent.SubmitLAQ)
    verifyLAQ(socket: Socket, answer: string) {
        this.gameService.verifyLAQ(socket, answer);
    }

    @SubscribeMessage(GameEvent.Leave)
    leave(socket: Socket) {
        this.gameService.leave(socket);
    }

    handleConnection(socket: Socket) {
        this.logger.log(`Connected socket: ${socket.id}`);
    }

    handleDisconnect(socket: Socket) {
        this.leave(socket);
        this.logger.log(`Disconnected socket: ${socket.id}`);
    }
}
