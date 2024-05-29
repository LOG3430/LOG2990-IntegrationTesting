import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { BroadcastOperatorMock, broadcastMock } from '@app/utils/socket-mock';
import { MessageEvent } from '@common/events';
import { getDateString } from '@app/utils/date';
import { Message } from '@common/message';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';

describe('ChatService', () => {
    const now = new Date();
    jest.useFakeTimers();
    jest.setSystemTime(now);

    let service: ChatService;
    let server: SinonStubbedInstance<Server>;
    let broadcastSpy: BroadcastOperatorMock;

    const username = 'usernameTest';
    const message: Message = {
        sender: 'moi',
        content: 'allo',
        time: '20:02',
    };

    beforeEach(async () => {
        server = createStubInstance<Server>(Server);
        server.to.returns((broadcastSpy = broadcastMock()));

        const module: TestingModule = await Test.createTestingModule({
            providers: [ChatService],
        }).compile();

        service = module.get<ChatService>(ChatService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validation', () => {
        const content = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
        const longContent = content + content + content + content;

        it('should return formatted message', () => {
            expect(ChatService.formatMessage(username, content)).toStrictEqual({ sender: username, content, time: getDateString() });
        });

        it('should return true when the message is below 200 characters', () => {
            expect(service['validate'](content)).toEqual(true);
        });

        it('should return false when the message is over 200 characters', () => {
            expect(service['validate'](longContent)).toEqual(false);
        });

        it("should not send when content isn't valid", () => {
            service.sendMessage(ChatService.formatMessage(username, longContent), server, {} as Room<Player>);
            expect(broadcastSpy.emit.notCalled).toBeTruthy();
        });
    });

    describe('messaging', () => {
        describe('sending', () => {
            it('should not fail when room is undefined', () => {
                expect(() => service.sendMessage({} as Message, server, undefined)).not.toThrow();
                expect(broadcastSpy.emit.notCalled).toBeTruthy();
            });

            it('should save and send messages', () => {
                const room = { messages: [], getId: () => 'id' } as Room<Player>;
                service.sendMessage(message, server, room);
                expect(room.messages).toEqual([message]);
                expect(server.to.calledOnceWith('id')).toBeTruthy();
                expect(broadcastSpy.emit.calledOnceWith(MessageEvent.Message, [message])).toBeTruthy();
            });
        });

        describe('receiving', () => {
            it('should fetch messages', () => {
                const room = { messages: [message] } as Room<Player>;
                expect(service.getMessages(room)).toEqual([message]);
            });

            it('should not fail when room is undefined', () => {
                expect(service.getMessages(undefined)).toEqual([]);
            });
        });
    });
});
