import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService } from '@app/services/chat/chat.service';
import { GameService } from '@app/services/game/game.service';
import { Message } from '@common/message';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
    content: string = '';
    messages: Message[] = [];

    private messageSubscription: Subscription;
    private muteSubscription: Subscription;

    constructor(
        private chatService: ChatService,
        private gameService: GameService,
    ) {}

    ngOnInit() {
        this.listenToMessages();
        this.chatService.init();
    }

    ngOnDestroy(): void {
        this.messageSubscription?.unsubscribe();
        this.muteSubscription?.unsubscribe();
    }

    isMe(username: string): boolean {
        return this.gameService.isMe(username);
    }

    myName(): string {
        return this.gameService.getMyName();
    }

    isMuted(): boolean {
        return this.chatService.isMuted();
    }

    handleEvent(event: KeyboardEvent) {
        event.stopPropagation();
        if (event.key === 'Enter') {
            this.sendMessage();
        }
    }

    sendMessage(): void {
        const msg = this.content.trim();
        if (msg.length > 0 && !this.isMuted()) {
            this.chatService.sendMessage(msg);
            this.content = '';
        }
    }

    private listenToMessages(): void {
        this.messageSubscription = this.chatService.onMessage().subscribe((messages: Message[]) => {
            this.messages.push(...messages);
        });
    }
}
