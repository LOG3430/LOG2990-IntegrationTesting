import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private socket: Socket;

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        if (!this.isSocketAlive()) {
            this.socket = io(environment.gatewayUrl, { transports: ['websocket'], upgrade: false });
        }
    }

    disconnect() {
        this.socket.disconnect();
    }

    on<T>(event: string, action: (data: T) => void): void {
        this.socket.on(event, action);
    }

    send<T, U>(event: string, data?: T, callback?: (serverResponse: U) => void): void {
        this.socket.emit(event, ...[data, callback].filter((x) => x));
    }
}
