import { GameRoom } from '@app/classes/game-room/game-room';
import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { ChatService } from '@app/services/chat/chat.service';
import { GameService, SystemMessage } from '@app/services/game/game.service';
import { socketMock } from '@app/utils/socket-mock';
import { MessageEvent } from '@common/events';
import { Message } from '@common/message';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, match } from 'sinon';
import { Server } from 'socket.io';
import { ChatGateway } from './chat.gateway';
import { Subject } from 'rxjs';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let chatService: SinonStubbedInstance<ChatService>;
    let gameService: SinonStubbedInstance<GameService>;
    let gameRoom: SinonStubbedInstance<GameRoom>;
    let room: SinonStubbedInstance<Room<Player>>;
    let server: SinonStubbedInstance<Server>;
    let systemMessageSubject: Subject<SystemMessage>;

    const message = 'allo';
    const socket = socketMock('org');
    const formattedMessage: Message = {
        sender: 'moi',
        content: 'allo',
        time: '20:02',
    };

    beforeEach(async () => {
        chatService = createStubInstance(ChatService);
        gameService = createStubInstance(GameService);
        gameRoom = createStubInstance(GameRoom);
        gameRoom.room = room = createStubInstance(Room<Player>);
        server = createStubInstance<Server>(Server);

        gameService.onSystemMessage.returns((systemMessageSubject = new Subject()));

        const module: TestingModule = await Test.createTestingModule({
            providers: [ChatGateway, { provide: ChatService, useValue: chatService }, { provide: GameService, useValue: gameService }],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should allow loading existing messages', () => {
        gameService.getGameRoom.returns(gameRoom);
        chatService.getMessages.returns([formattedMessage]);
        gateway.load(socket);
        expect(chatService.getMessages.calledOnceWith(gameRoom.room)).toBeTruthy();
        expect(socket.emit.calledOnceWith(MessageEvent.Message, [formattedMessage])).toBeTruthy();
    });

    it('broadcast should forward call', () => {
        room.getAnyone.returns({} as Player);
        gameService.getGameRoom.returns(gameRoom);
        jest.spyOn(ChatService, 'formatMessage').mockReturnValue({ sender: 'bla' } as Message);

        gateway.broadcast(socket, message);
        expect(chatService.sendMessage.calledOnceWith({ sender: 'bla' })).toBeTruthy();
    });

    it("broadcast should not fail if room doesn't exist", () => {
        gameService.getGameRoom.returns(undefined);
        gateway.broadcast(socket, message);
        expect(chatService.sendMessage.calledOnceWith(match.any, server, undefined)).toBeTruthy();
    });

    it('getRoom should return room', () => {
        gateway['getRoom'](socket);
        expect(gameService.getGameRoom.calledOnceWith(socket)).toBeTruthy();
    });

    it('should send system messages from game service', () => {
        systemMessageSubject.next({ message: { content: 'bla' } as Message, room });
        expect(chatService.sendMessage.calledOnceWith({ content: 'bla' }, server, room)).toBeTruthy();
    });
});
