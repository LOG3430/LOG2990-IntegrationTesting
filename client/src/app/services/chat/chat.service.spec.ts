import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/socket/socket.service';
import { EventEmitFunc, socketServiceMock } from '@app/utils/socket-test-helpers';
import { MessageEvent } from '@common/events';
import { Message } from '@common/message';
import { ChatService } from './chat.service';

describe('ChatService', () => {
    let chatService: ChatService;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let emulateEvent: EventEmitFunc;
    let router: Router;
    const content = 'allo';
    const message: Message = {
        content: 'allo',
        sender: 'allo',
        time: '20:02',
    };

    beforeEach(() => {
        [socketServiceSpy, emulateEvent] = socketServiceMock();

        router = jasmine.createSpyObj('Router', ['navigate']);
        TestBed.configureTestingModule({
            providers: [ChatService, { provide: SocketService, useValue: socketServiceSpy }, { provide: Router, useValue: router }],
        });

        chatService = TestBed.inject(ChatService);
        chatService.init();
    });

    it('should be created', () => {
        expect(chatService).toBeTruthy();
    });

    it('sould send message', () => {
        chatService.sendMessage(content);
        expect(socketServiceSpy.send).toHaveBeenCalledWith(MessageEvent.Sent, content);
    });

    it('should update message on Message event', () => {
        let msg: Message = {} as Message;
        const sub = chatService.onMessage().subscribe((m) => {
            msg = m[0];
        });

        emulateEvent(MessageEvent.Message, [message]);
        sub.unsubscribe();

        expect(msg.sender).toBe(message.sender);
        expect(msg.content).toBe(message.content);
        expect(msg.time).toBe(message.time);
    });

    describe('muting', () => {
        it('should update when told', () => {
            emulateEvent(MessageEvent.Muted, true);
            expect(chatService.isMuted()).toBe(true);

            emulateEvent(MessageEvent.Muted, false);
            expect(chatService.isMuted()).toBe(false);
        });

        it('should reset when init', () => {
            emulateEvent(MessageEvent.Muted, true);
            expect(chatService.isMuted()).toBe(true);

            chatService.init();
            expect(chatService.isMuted()).toBe(false);
        });
    });

    describe('init', () => {
        it('should not duplicate socket listeners', () => {
            const msgSpy = jasmine.createSpy();

            chatService.init();
            chatService.init();
            chatService.init();

            chatService.onMessage().subscribe(msgSpy);

            emulateEvent(MessageEvent.Message, '...');
            expect(msgSpy).toHaveBeenCalledOnceWith('...');
        });
    });
});
