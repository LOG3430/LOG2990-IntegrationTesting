import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { ChatService } from '@app/services/chat/chat.service';
import { GameService, SystemMessage } from '@app/services/game/game.service';
import { MessageEvent } from '@common/events';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {
    @WebSocketServer() server: Server;

    constructor(
        private readonly chatService: ChatService,
        private gameService: GameService,
    ) {
        this.gameService.onSystemMessage().subscribe((msg: SystemMessage) => {
            this.chatService.sendMessage(msg.message, this.server, msg.room);
        });
    }

    @SubscribeMessage(MessageEvent.Load)
    load(socket: Socket) {
        socket.emit(MessageEvent.Message, this.chatService.getMessages(this.getRoom(socket)));
    }

    @SubscribeMessage(MessageEvent.Sent)
    broadcast(client: Socket, message: string) {
        this.chatService.sendMessage(this.formatMessage(client, message), this.server, this.getRoom(client));
    }

    private formatMessage(client: Socket, message: string) {
        return ChatService.formatMessage(this.getUsername(client), message);
    }

    private getRoom(socket: Socket): Room<Player> | undefined {
        return this.gameService.getGameRoom(socket)?.room;
    }

    private getUsername(socket: Socket): string | undefined {
        return this.getRoom(socket)?.getAnyone(socket)?.username;
    }
}
