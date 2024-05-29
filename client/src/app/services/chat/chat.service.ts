import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { MessageEvent } from '@common/events';
import { Message } from '@common/message';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    private muted: boolean = false;
    private messageSubject: Subject<Message[]> = new Subject();

    constructor(private socketService: SocketService) {
        this.socketService.connect();
        this.configureSocket();
    }

    init() {
        this.muted = false;
        this.socketService.send(MessageEvent.Load);
    }

    isMuted(): boolean {
        return this.muted;
    }

    sendMessage(content: string): void {
        this.socketService.send(MessageEvent.Sent, content);
    }

    onMessage(): Observable<Message[]> {
        return this.messageSubject;
    }

    private configureSocket() {
        this.socketService.on(MessageEvent.Message, (messages: Message[]) => {
            this.messageSubject.next(messages);
        });

        this.socketService.on(MessageEvent.Muted, (muted: boolean) => {
            this.muted = muted;
        });
    }
}
