import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppMaterialModule } from '@app/modules/material.module';
import { ChatService } from '@app/services/chat/chat.service';
import { GameService } from '@app/services/game/game.service';
import { Subject } from 'rxjs';
import { ChatComponent } from './chat.component';
import { Message } from '@common/message';
import { DateFormatterPipe } from '@app/pipes/date-formatter/date-formatter.pipe';

describe('ChatComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;
    let chatService: jasmine.SpyObj<ChatService>;
    let gameService: jasmine.SpyObj<GameService>;

    let msgSubject: Subject<Message[]>;

    const msg = (txt: string): Message => {
        return {
            content: txt,
            sender: txt,
            time: Date.now().toString(),
        };
    };

    beforeEach(() => {
        chatService = jasmine.createSpyObj<ChatService>('ChatService', ['onMessage', 'sendMessage', 'isMuted', 'init']);
        chatService.onMessage.and.returnValue((msgSubject = new Subject()));

        chatService.isMuted.and.returnValue(false);

        gameService = jasmine.createSpyObj<GameService>('GameService', ['getMyName', 'isMe']);

        TestBed.configureTestingModule({
            imports: [AppMaterialModule, FormsModule],
            declarations: [ChatComponent, DateFormatterPipe],
            providers: [
                { provide: ChatService, useValue: chatService },
                { provide: GameService, useValue: gameService },
            ],
        });

        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('receiving', () => {
        it('should receive messages from server', () => {
            const initialMsgs = [msg('a'), msg('b'), msg('c')];
            const nextMsg = msg('d');

            msgSubject.next(initialMsgs);
            expect(component.messages).toEqual(initialMsgs);

            msgSubject.next([nextMsg]);
            expect(component.messages).toEqual([...initialMsgs, nextMsg]);
        });
    });

    describe('sending', () => {
        it('should send trimmed message to ChatService', () => {
            const testMessageContent = '   Test message content    ';
            component.content = testMessageContent;
            component.sendMessage();
            expect(chatService.sendMessage).toHaveBeenCalledWith(testMessageContent.trim());
            expect(component.content).toEqual('');
        });

        it('should not send empty message', () => {
            component.content = '      ';
            component.sendMessage();
            expect(chatService.sendMessage).toHaveBeenCalledTimes(0);
        });

        it('should not send if muted', () => {
            chatService.isMuted.and.returnValue(true);
            component.content = 'bla';
            component.sendMessage();
            expect(chatService.sendMessage).not.toHaveBeenCalled();
        });
    });

    it('should give our name', () => {
        const name = 'abc';
        gameService.getMyName.and.returnValue(name);
        expect(component.myName()).toBe(name);
    });

    it('should stop propagation of keyboard input for keypress events', () => {
        const e = { type: 'keypress', stopPropagation: jasmine.createSpy() };
        component.handleEvent(e as unknown as KeyboardEvent);
        expect(e.stopPropagation).toHaveBeenCalledTimes(1);
    });

    it('should submit if keypress is enter', () => {
        const e = { key: 'Enter', type: 'keypress', stopPropagation: jasmine.createSpy() };
        component.content = 'some text';

        component.handleEvent(e as unknown as KeyboardEvent);

        expect(chatService.sendMessage).toHaveBeenCalledWith('some text');
    });

    it("should ask game service if it's us", () => {
        [true, false].forEach((v) => {
            gameService.isMe.and.returnValue(v);
            expect(component.isMe('bla')).toBe(v);
            expect(gameService.isMe).toHaveBeenCalledOnceWith('bla');
            gameService.isMe.calls.reset();
        });
    });
});
