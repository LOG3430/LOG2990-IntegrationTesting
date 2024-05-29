import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { MAX_MESSAGE_LENGTH } from '@common/constants';
import { Message } from '@common/message';
import { MessageEvent } from '@common/events';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { getDateString } from '@app/utils/date';

@Injectable()
export class ChatService {
    static formatMessage(sender: string, content: string): Message {
        return { sender, content, time: getDateString() };
    }

    getMessages(room: Room<Player> | undefined): Message[] {
        return room?.messages ?? [];
    }

    sendMessage(msg: Message, server: Server, room: Room<Player> | undefined) {
        if (room && this.validate(msg.content)) {
            this.addMessage(room, msg);
            server.to(room.getId()).emit(MessageEvent.Message, [msg]);
        }
    }

    private validate(message: string): boolean {
        return message.length < MAX_MESSAGE_LENGTH;
    }

    private addMessage(room: Room<Player> | undefined, message: Message): void {
        room?.messages.push(message);
    }
}
